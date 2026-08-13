import { education, experience, skills } from '../data/candidate/index.ts'
import { isEvidenceQuery, isResumeQuery, retrieveCandidateContext } from './retrieval.ts'
import { getLlmClient, parseStructuredResponse } from './gemini.ts'
import { appendMessage, getOrCreateConversation } from './conversation.ts'
import { AppError, type ChatMode, type ChatResponse, type MessageSection } from '../types.ts'

export async function handleChat(input: {
  message: string
  conversationId?: string
  mode: ChatMode
}): Promise<ChatResponse> {
  const conversation = getOrCreateConversation(input.conversationId)
  const retrieval = retrieveCandidateContext(input.message)

  if (isResumeQuery(input.message)) {
    const response = buildResumeResponse(conversation.id)
    persistTurn(conversation.id, input.message, response.message)
    return response
  }

  let generated
  try {
    generated = await getLlmClient().generate({
      message: input.message,
      mode: input.mode,
      context: retrieval.context,
      history: conversation.messages,
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable')
  }

  const showEvidence = isEvidenceQuery(input.message)
  const isResume = generated.isResume || generated.intro.trim().toUpperCase().startsWith('RESUME')
  const spoken = enforceThirdPerson(
    flattenChatMessage(isResume
      ? generated.intro.replace(/^RESUME\s*/i, '').trim() || generated.intro
      : generated.intro),
  )

  const response: ChatResponse = {
    message: spoken,
    sections: isResume ? generated.sections : [],
    sources: showEvidence ? retrieval.sources : [],
    conversationId: conversation.id,
    isResume,
  }

  persistTurn(conversation.id, input.message, spoken)
  return response
}

function persistTurn(conversationId: string, userMessage: string, assistantMessage: string): void {
  appendMessage(conversationId, { role: 'user', content: userMessage })
  appendMessage(conversationId, { role: 'assistant', content: assistantMessage })
}

function flattenChatMessage(raw: string): string {
  const spoken = parseStructuredResponse(raw).intro.trim()
  return spoken || raw
}

export function enforceThirdPerson(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  let out = rewriteOpening(trimmed)
  out = out.replace(/([.!?]\s+)I\b/g, '$1He')
  out = out
    .replace(/\bI['’]m\b/g, "he's")
    .replace(/\bI am\b/g, 'he is')
    .replace(/\bI['’]ve\b/g, 'he has')
    .replace(/\bI['’]d\b/g, "he'd")
    .replace(/\bI['’]ll\b/g, "he'll")
    .replace(/\bI\b/g, 'he')
    .replace(/\bme\b/g, 'him')
    .replace(/\bmyself\b/g, 'himself')
    .replace(/\b[Mm]y\b/g, 'his')
    .replace(/\bmine\b/g, 'his')
  return out
}

function rewriteOpening(text: string): string {
  if (/^Imani\b/i.test(text)) return text
  if (/^I['’]m\b/i.test(text)) return text.replace(/^I['’]m\b/i, 'Imani is')
  if (/^I am\b/i.test(text)) return text.replace(/^I am\b/i, 'Imani is')
  if (/^I['’]ve\b/i.test(text)) return text.replace(/^I['’]ve\b/i, 'Imani has')
  if (/^I['’]d\b/i.test(text)) return text.replace(/^I['’]d\b/i, 'Imani would')
  if (/^I['’]ll\b/i.test(text)) return text.replace(/^I['’]ll\b/i, 'Imani will')
  if (/^My name is\b/i.test(text)) return text.replace(/^My name is\b/i, 'Imani is')
  if (/^My\b/i.test(text)) return text.replace(/^My\b/i, "Imani's")
  if (/^I\b/i.test(text)) return text.replace(/^I\b/i, 'Imani')
  return text
}

function buildResumeResponse(conversationId: string): ChatResponse {
  const sections: MessageSection[] = [
    {
      label: 'EDUCATION',
      body: `${education.school} — ${education.degree}. Relevant coursework includes ${education.coursework.join(', ')}.`,
      tags: ['KSU', 'Computer Science', 'ML', 'Deep Learning', 'Dec 2026'],
    },
    {
      label: 'EXPERIENCE HIGHLIGHTS',
      body: `Professional roles spanning software engineering, AI, cybersecurity, and enterprise automation at ${experience
        .map((role) => role.organization)
        .filter((name) => name !== 'Lutheran Service School')
        .join(', ')}.`,
      tags: experience.map((role) => role.organization).filter((name) => name !== 'Lutheran Service School'),
      metrics: ['+15% throughput', '80%→20% backlog', '500+ users/reach'],
    },
    {
      label: 'TECHNICAL SKILLS',
      body: 'Languages, frameworks, tools, and platforms across the full engineering stack.',
      tags: [
        ...skills.languages.slice(0, 4),
        ...skills.frameworks.slice(0, 4),
        'PostgreSQL',
        'AWS',
        'Docker',
      ],
    },
  ]

  return {
    message:
      "Imani Gad's resume is available to download and preview below. It covers his education, work history, technical skill set, projects, and activities.",
    sections,
    sources: [],
    conversationId,
    isResume: true,
  }
}
