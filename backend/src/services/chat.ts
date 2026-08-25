import { education, experience, skills } from '../data/candidate/index.ts'
import {
  casualFollowUps,
  classifyConversationIntent,
  conversationalReply,
  introductionReply,
  isBareProofQuery,
  isConversationalIntent,
  needsLlm,
  needsRetrieval,
  proofReply,
} from './intent.ts'
import {
  isContactQuery,
  retrieveCandidateContext,
  type RetrievalResult,
} from './retrieval.ts'
import { getLlmClient, parseStructuredResponse } from './gemini.ts'
import { appendMessage, getOrCreateConversation, patchSession, recordRetrievalOnSession } from './conversation.ts'
import { trackEvent } from './analytics.ts'
import {
  buildDifferentiatorGroups,
  buildFollowUps,
  buildRecruiterSummary,
  toProjectDeepDive,
} from './recruiter.ts'
import {
  AppError,
  type ChatMode,
  type ChatResponse,
  type ConversationIntent,
  type ConversationMessage,
  type MessageSection,
  type RecruiterSession,
} from '../types.ts'

export async function handleChat(input: {
  message: string
  conversationId?: string
  mode: ChatMode
}): Promise<ChatResponse> {
  const conversation = getOrCreateConversation(input.conversationId)
  const intent = classifyConversationIntent(input.message)

  if (isConversationalIntent(intent)) {
    const message = conversationalReply(intent, conversation.messages.length)
    const session = conversation.session
    const response = conversationalResponse({
      conversationId: conversation.id,
      session,
      message,
      intent,
      followUps: casualFollowUps(intent),
    })
    persistTurn(conversation.id, input.message, message)
    return response
  }

  if (intent === 'introduction') {
    const message = introductionReply()
    const session = conversation.session
    trackEvent({ type: 'question_asked', query: input.message, conversationId: conversation.id })
    const response = conversationalResponse({
      conversationId: conversation.id,
      session,
      message,
      intent,
      followUps: casualFollowUps(intent),
    })
    persistTurn(conversation.id, input.message, message)
    return response
  }

  if (intent === 'resume') {
    const updated = patchSession(conversation.id, { resumeViewed: true })
    trackEvent({ type: 'resume_viewed', conversationId: conversation.id })
    const response = buildResumeResponse(conversation.id, updated)
    persistTurn(conversation.id, input.message, response.message)
    return response
  }

  const retrievalQuery = resolveRetrievalQuery(input.message, conversation.messages, intent)
  const retrieval = needsRetrieval(intent)
    ? retrieveCandidateContext(retrievalQuery)
    : emptyRetrieval()
  const session = recordRetrievalOnSession(conversation.id, retrieval.sources, input.message)
  trackEvent({ type: 'question_asked', query: input.message, conversationId: conversation.id })

  if (intent === 'proof') {
    const message = proofReply(conversation.messages.some((item) => item.role === 'user'))
    const response = buildProofResponse(conversation.id, session, retrieval, message)
    persistTurn(conversation.id, input.message, message)
    return response
  }

  if (!needsLlm(intent)) {
    const message = conversationalReply('assistant', conversation.messages.length)
    const response = conversationalResponse({
      conversationId: conversation.id,
      session,
      message,
      intent,
      followUps: casualFollowUps(intent),
    })
    persistTurn(conversation.id, input.message, message)
    return response
  }

  let generated
  try {
    generated = await getLlmClient().generate({
      message: input.message,
      mode: input.mode,
      context: retrieval.context,
      history: conversation.messages,
      verified: retrieval.verified,
      verificationNote: retrieval.verificationNote,
      intent,
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'The assistant is temporarily unavailable.', 'gemini_unavailable')
  }

  const isResume = generated.isResume || generated.intro.trim().toUpperCase().startsWith('RESUME')
  const spoken = enforceThirdPerson(
    flattenChatMessage(
      isResume
        ? generated.intro.replace(/^RESUME\s*/i, '').trim() || generated.intro
        : generated.intro,
    ),
  )

  const whyHire = intent === 'why_hire'
  const projectDeepDive =
    !whyHire && retrieval.projectId ? toProjectDeepDive(retrieval.projectId) : undefined
  if (projectDeepDive) {
    trackEvent({ type: 'project_viewed', query: projectDeepDive.title, conversationId: conversation.id })
  }

  const response: ChatResponse = {
    message: spoken,
    sections: isResume ? generated.sections : [],
    sources: retrieval.sources.slice(0, 8),
    conversationId: conversation.id,
    isResume,
    verified: retrieval.verified,
    verificationNote: retrieval.verificationNote,
    followUps: buildFollowUps(input.message, retrieval.sources),
    retrievalStages: retrieval.stages,
    recruiterSummary: input.mode === 'recruiter' ? buildRecruiterSummary(retrieval.sources) : undefined,
    projectDeepDive,
    differentiators: whyHire ? buildDifferentiatorGroups() : undefined,
    showContactCta: isContactQuery(input.message) || session.questionsAsked >= 3,
    session,
    intent,
    conversational: false,
    revealSources: false,
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
  if (isAssistantVoice(trimmed)) return trimmed

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

function isAssistantVoice(text: string): boolean {
  return /\bI['’]m Imani['’]s AI assistant\b/i.test(text) || /\bI am Imani['’]s AI assistant\b/i.test(text)
}

function rewriteOpening(text: string): string {
  if (/^Imani\b/i.test(text)) return text
  if (/^Hey\b/i.test(text) || /^Hi\b/i.test(text) || /^Hello\b/i.test(text)) return text
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

function resolveRetrievalQuery(
  message: string,
  history: ConversationMessage[],
  intent: ConversationIntent,
): string {
  if (intent !== 'proof' || !isBareProofQuery(message)) return message
  const previous = [...history].reverse().find((item) => item.role === 'user')
  return previous?.content || message
}

function conversationalResponse(input: {
  conversationId: string
  session: RecruiterSession
  message: string
  intent: ConversationIntent
  followUps: string[]
}): ChatResponse {
  return {
    message: input.message,
    sections: [],
    sources: [],
    conversationId: input.conversationId,
    isResume: false,
    verified: true,
    followUps: input.followUps,
    retrievalStages: [],
    showContactCta: false,
    session: input.session,
    intent: input.intent,
    conversational: true,
    revealSources: false,
  }
}

function buildProofResponse(
  conversationId: string,
  session: RecruiterSession,
  retrieval: RetrievalResult,
  message: string,
): ChatResponse {
  return {
    message,
    sections: [],
    sources: retrieval.sources.slice(0, 8),
    conversationId,
    isResume: false,
    verified: retrieval.verified,
    verificationNote: retrieval.verificationNote,
    followUps: buildFollowUps('show me proof', retrieval.sources),
    retrievalStages: retrieval.stages,
    showContactCta: session.questionsAsked >= 3,
    session,
    intent: 'proof',
    conversational: false,
    revealSources: true,
  }
}

function emptyRetrieval(): RetrievalResult {
  return {
    categories: [],
    intents: [],
    context: '',
    sources: [],
    stages: [],
    verified: true,
    expandedTerms: [],
  }
}

function buildResumeResponse(
  conversationId: string,
  session: ChatResponse['session'],
): ChatResponse {
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
      "Imani's résumé is below — education, work history, skills, projects, and activities. Preview or download the PDF if you want the official version.",
    sections,
    sources: [],
    conversationId,
    isResume: true,
    verified: true,
    followUps: [
      'Why should I interview Imani Gad?',
      'Tell me about DevDash',
      'What backend experience does he have?',
      'What AI experience does Imani have?',
    ],
    retrievalStages: [],
    showContactCta: true,
    session: { ...session, resumeViewed: true },
    intent: 'resume',
    conversational: false,
    revealSources: false,
  }
}
