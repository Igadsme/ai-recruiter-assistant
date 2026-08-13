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
  const spoken = flattenChatMessage(isResume
    ? generated.intro.replace(/^RESUME\s*/i, '').trim() || generated.intro
    : generated.intro)

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
