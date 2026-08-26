import { config, GEMINI_MODEL_FALLBACKS } from '../config.ts'
import { logger } from '../logger.ts'
import { CANDIDATE_ASSISTANT_PROMPT } from '../prompts/candidateAssistant.ts'
import { AppError, type ChatMode, type ConversationMessage, type GeminiStructuredResponse } from '../types.ts'

type GeminiSdkClient = {
  models: {
    generateContent: (request: Record<string, unknown>) => Promise<{ text?: string }>
  }
}

export type GenerateChatInput = {
  message: string
  mode: ChatMode
  context: string
  history: ConversationMessage[]
  verified?: boolean
  verificationNote?: string
  intent?: string
}

export type LlmClient = {
  generate(input: GenerateChatInput): Promise<GeminiStructuredResponse>
}

const HISTORY_LIMIT = 8

export class GeminiClient implements LlmClient {
  private client: GeminiSdkClient | null = null
  private readonly apiKey: string

  constructor(apiKey = config.geminiApiKey) {
    if (!apiKey) {
      throw new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable')
    }
    this.apiKey = apiKey
  }

  async generate(input: GenerateChatInput): Promise<GeminiStructuredResponse> {
    if (!this.client) {
      const { GoogleGenAI } = await import('@google/genai')
      this.client = new GoogleGenAI({ apiKey: this.apiKey }) as unknown as GeminiSdkClient
    }

    const contents = [
      ...input.history.slice(-HISTORY_LIMIT).map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })),
      {
        role: 'user',
        parts: [{ text: buildUserTurn(input) }],
      },
    ]

    const models = uniqueModels([config.geminiModel, ...GEMINI_MODEL_FALLBACKS])
    let lastError: unknown

    for (const model of models) {
      try {
        const response = await withTimeout(
          this.client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: CANDIDATE_ASSISTANT_PROMPT,
              temperature: input.mode === 'recruiter' ? 0.55 : 0.8,
              maxOutputTokens: 2800,
            },
          }),
          config.geminiTimeoutMs,
        )

        const text = response.text?.trim()
        if (!text) {
          throw new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable')
        }

        if (model !== config.geminiModel) {
          logger.info({ model }, 'gemini fallback model succeeded')
        }
        return parseStructuredResponse(text)
      } catch (error) {
        lastError = error
        if (error instanceof AppError && error.code !== 'gemini_unavailable') throw error
        if (!isRetryableGeminiError(error)) {
          logger.error({ err: sanitizeGeminiError(error), model }, 'gemini generation failed')
          throw new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable')
        }
        logger.warn({ err: sanitizeGeminiError(error), model }, 'gemini model unavailable, trying fallback')
      }
    }

    logger.error({ err: sanitizeGeminiError(lastError) }, 'gemini generation failed')
    throw new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable')
  }
}

export function parseStructuredResponse(raw: string): GeminiStructuredResponse {
  const trimmed = stripCodeFences(raw).trim()
  const parsed = parseJsonObject(trimmed)

  if (!parsed) {
    return { intro: trimmed, sections: [] }
  }

  const sections = Array.isArray(parsed.sections)
    ? parsed.sections
        .filter((section) => section && typeof section === 'object')
        .map((section) => {
          const item = section as Record<string, unknown>
          return {
            label: String(item.label ?? item.Label ?? '').trim(),
            body: String(item.body ?? item.Body ?? '').trim(),
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            metrics: Array.isArray(item.metrics) ? item.metrics.map(String) : undefined,
          }
        })
        .filter((section) => section.body)
    : []

  const intro = pickSpokenText(parsed) || sections.map((section) => section.body).join('\n\n')
  if (!intro) {
    return { intro: trimmed.startsWith('{') ? '' : trimmed, sections: [] }
  }

  const claims = Array.isArray(parsed.claims)
    ? parsed.claims
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const claim = item as Record<string, unknown>
          return {
            text: String(claim.text ?? claim.claim ?? '').trim(),
            sourceIds: Array.isArray(claim.sourceIds) ? claim.sourceIds.map(String) : [],
          }
        })
        .filter((item) => item.text)
    : undefined

  return {
    intro,
    sections,
    isResume: Boolean(parsed.isResume ?? parsed.IsResume),
    claims,
  }
}

function pickSpokenText(parsed: Record<string, unknown>): string {
  for (const key of ['intro', 'Intro', 'message', 'Message', 'text', 'answer']) {
    const value = parsed[key]
    if (typeof value === 'string' && value.trim() && !value.trim().startsWith('{')) {
      return value.trim()
    }
  }
  return ''
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw.startsWith('{')) return null
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const value = JSON.parse(raw.slice(start, end + 1)) as unknown
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const model of models) {
    const name = model.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    result.push(name)
  }
  return result
}

function isRetryableGeminiError(error: unknown): boolean {
  if (error instanceof AppError && error.code === 'gemini_unavailable') return true
  const message = error instanceof Error ? error.message : String(error)
  return /429|503|400|INVALID_ARGUMENT|UNAVAILABLE|RESOURCE_EXHAUSTED|quota|high demand|no longer available|not found/i.test(
    message,
  )
}

function buildUserTurn(input: GenerateChatInput): string {
  const followUp = input.history.length > 0
  const whyHire = input.intent === 'why_hire'
  return [
    `Mode: ${input.mode}`,
    input.intent ? `Conversation intent: ${input.intent}` : '',
    `Verification: ${input.verified === false ? 'NOT VERIFIED' : 'VERIFIED'}`,
    input.verificationNote ? `Verification note: ${input.verificationNote}` : '',
    '',
    followUp
      ? 'This is a follow-up. Use the previous conversation naturally. Do not restart his biography. Do not begin with "Imani Gad is" unless that is the most natural answer.'
      : 'Answer the question they asked. Do not deliver a résumé summary unless they asked who he is, why to hire him, or for his résumé.',
    whyHire
      ? 'They asked why to hire or interview him. Give a structured, evidence-first pitch in a few short paragraphs — still conversational, not a dump of resume bullets.'
      : 'Keep it to one or two natural sentences first. Add a little more only if the question needs it.',
    'When talking about Imani, use he/him. You may say "I\'m Imani\'s AI assistant" only if they asked who you are.',
    'If a fact is not in the context, say: "I don\'t have that information, but you can ask Imani directly."',
    'Name specific roles and projects from the context when you make a claim.',
    'Reply as JSON: {"intro":"...","claims":[{"text":"...","sourceIds":["experience:shaw"]}]}',
    'Every factual sentence needs a claims[] entry whose sourceIds exist in the context.',
    input.mode === 'recruiter'
      ? 'Recruiter mode: tighter, evidence-first, no filler. Recruiters already have the brief — do not repeat his full life story unless asked.'
      : '',
    '',
    'Verified candidate context for this question:',
    input.context,
    '',
    `Recruiter question: ${input.message}`,
  ]
    .filter((line) => line !== '')
    .join('\n')
}

function stripCodeFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable'))
    }, ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function sanitizeGeminiError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.replace(/key[=\s][\w-]+/gi, 'key=[redacted]').slice(0, 200),
    }
  }
  return { name: 'Error', message: 'unknown' }
}

let defaultClient: LlmClient | null = null

export function getLlmClient(): LlmClient {
  if (!defaultClient) {
    defaultClient = new GeminiClient()
  }
  return defaultClient
}

export function setLlmClientForTests(client: LlmClient | null): void {
  defaultClient = client
}
