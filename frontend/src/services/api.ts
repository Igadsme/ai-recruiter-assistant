export type ChatMode = 'general' | 'recruiter'

export type Source = {
  type: string
  title: string
  organization?: string
  date?: string
  technologies?: string[]
  metrics?: string[]
  relevantExcerpt?: string
}

export type ChatSection = {
  label: string
  body: string
  tags: string[]
  metrics?: string[]
}

export type ChatApiResponse = {
  message: string
  sections: ChatSection[]
  sources: Source[]
  conversationId: string
  isResume?: boolean
}

export type ApiErrorCode = 'rate_limit' | 'network' | 'unavailable' | 'ai' | 'empty' | 'unknown'

const AI_ERROR = 'Something went wrong while processing that question.'
const NETWORK_ERROR = 'Unable to connect to the assistant.'
const RATE_LIMIT_ERROR = "You've reached the current request limit. Please try again shortly."
const UNAVAILABLE_ERROR = 'The assistant is temporarily unavailable. Please try again shortly.'
const TIMEOUT_ERROR = 'The assistant is taking too long to respond. Please try again.'

export class ApiError extends Error {
  code: ApiErrorCode
  status?: number

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REQUEST_TIMEOUT_MS = 60_000

export function getErrorMessage(error: unknown): { code: ApiErrorCode; message: string } {
  if (error instanceof ApiError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof TypeError) {
    return { code: 'network', message: NETWORK_ERROR }
  }
  return {
    code: 'ai',
    message: AI_ERROR,
  }
}

export async function sendChat(input: {
  message: string
  conversationId?: string
  mode: ChatMode
}): Promise<ChatApiResponse> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as
      | ChatApiResponse
      | { error?: { code?: string; message?: string } }
      | null

    if (!response.ok) {
      throw mapHttpError(response.status, payload && 'error' in payload ? payload.error : undefined)
    }

    if (!payload || !('message' in payload) || typeof payload.message !== 'string') {
      throw new ApiError('ai', AI_ERROR, response.status)
    }

    const chat = payload as ChatApiResponse
    const wantsEvidence = isEvidenceQuery(input.message)
    return {
      ...chat,
      message: flattenSpokenReply(chat.message),
      sections: chat.isResume ? chat.sections ?? [] : [],
      sources: wantsEvidence ? chat.sources ?? [] : [],
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('unavailable', TIMEOUT_ERROR)
    }
    throw new ApiError('network', NETWORK_ERROR)
  } finally {
    window.clearTimeout(timer)
  }
}

export async function createConversation(): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/api/conversations`, { method: 'POST' })
  if (!response.ok) {
    throw new ApiError('network', NETWORK_ERROR, response.status)
  }
  return response.json() as Promise<{ id: string }>
}

function isEvidenceQuery(query: string): boolean {
  return /\b(evidence|sources?|proof|cite|citations?)\b/i.test(query)
}

function flattenSpokenReply(raw: string): string {
  const trimmed = stripCodeFences(raw).trim()
  if (!trimmed) return trimmed
  if (!trimmed.includes('{')) return trimmed

  const parsed = parseLooseObject(trimmed)
  if (parsed) {
    const spoken = pickSpokenField(parsed) || joinSectionBodies(parsed)
    if (spoken) return spoken
  }

  const extracted =
    extractQuotedField(trimmed, 'intro') ||
    extractQuotedField(trimmed, 'message') ||
    extractQuotedBodies(trimmed)
  if (extracted) return extracted

  if (/^\s*\{[\s\S]*"sections"[\s\S]*\}\s*$/.test(trimmed)) {
    return extractQuotedBodies(trimmed) || 'I can tell you more if you ask a specific question.'
  }

  return trimmed
}

function stripCodeFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
}

function parseLooseObject(raw: string): Record<string, unknown> | null {
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

function pickSpokenField(parsed: Record<string, unknown>): string {
  for (const key of ['intro', 'Intro', 'message', 'Message', 'text', 'answer']) {
    const value = parsed[key]
    if (typeof value === 'string' && value.trim() && !value.trim().startsWith('{')) {
      return value.trim()
    }
  }
  return ''
}

function joinSectionBodies(parsed: Record<string, unknown>): string {
  if (!Array.isArray(parsed.sections) && !Array.isArray(parsed.Sections)) return ''
  const sections = (parsed.sections ?? parsed.Sections) as unknown[]
  return sections
    .map((section) => {
      if (!section || typeof section !== 'object') return ''
      const item = section as Record<string, unknown>
      const body = item.body ?? item.Body
      return typeof body === 'string' ? body.trim() : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function extractQuotedField(raw: string, field: string): string {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i'))
  if (!match) return ''
  try {
    return JSON.parse(`"${match[1]}"`) as string
  } catch {
    return match[1]
  }
}

function extractQuotedBodies(raw: string): string {
  const bodies: string[] = []
  const pattern = /"body"\s*:\s*"((?:\\.|[^"\\])*)"/gi
  let match = pattern.exec(raw)
  while (match) {
    try {
      bodies.push(JSON.parse(`"${match[1]}"`) as string)
    } catch {
      bodies.push(match[1])
    }
    match = pattern.exec(raw)
  }
  return bodies.join('\n\n')
}

function mapHttpError(status: number, error?: { code?: string; message?: string }): ApiError {
  if (status === 429 || error?.code === 'rate_limited') {
    return new ApiError('rate_limit', RATE_LIMIT_ERROR, status)
  }
  if (status === 502 || status === 504) {
    return new ApiError('network', NETWORK_ERROR, status)
  }
  if (status === 503 || error?.code === 'gemini_unavailable') {
    return new ApiError('unavailable', UNAVAILABLE_ERROR, status)
  }
  if (status === 400) {
    return new ApiError('ai', error?.message ?? AI_ERROR, status)
  }
  return new ApiError('ai', AI_ERROR, status)
}
