import { interviewBank, interviewTracks, type InterviewTrack } from '../data/candidate/interviewBank.ts'
import { getLlmClient } from './gemini.ts'
import { appendMessage, getOrCreateConversation } from './conversation.ts'
import { retrieveCandidateContext } from './retrieval.ts'
import { trackEvent } from './analytics.ts'

export { interviewTracks }

export type InterviewResponse = {
  conversationId: string
  track: InterviewTrack
  question: string
  phase: 'ask' | 'followup' | 'wrap'
  sourceId?: string
  followUps: string[]
}

export async function handleInterview(input: {
  track: InterviewTrack
  message?: string
  conversationId?: string
}): Promise<InterviewResponse> {
  const conversation = getOrCreateConversation(input.conversationId)
  const bank = interviewBank.filter((item) => item.track === input.track)
  const asked = conversation.messages.filter((item) => item.role === 'assistant').length

  if (!input.message) {
    const first = bank[0]
    trackEvent({ type: 'interview_started', query: input.track, conversationId: conversation.id })
    appendMessage(conversation.id, { role: 'assistant', content: first.prompt })
    return {
      conversationId: conversation.id,
      track: input.track,
      question: first.prompt,
      phase: 'ask',
      sourceId: first.sourceId,
      followUps: [...first.followUps],
    }
  }

  appendMessage(conversation.id, { role: 'user', content: input.message })
  const current = bank[Math.min(asked, bank.length - 1)]
  const next = bank[Math.min(asked, bank.length - 1)]

  if (asked >= bank.length) {
    const wrap =
      'That is a solid pass through the verified work. A recruiter would likely probe system tradeoffs next — rate limits on GitHub for DevDash, or detection vs search latency on the camera project.'
    appendMessage(conversation.id, { role: 'assistant', content: wrap })
    return {
      conversationId: conversation.id,
      track: input.track,
      question: wrap,
      phase: 'wrap',
      followUps: ['Tell me about DevDash', 'What backend experience does he have?'],
    }
  }

  let question = next.followUps[0] ?? next.prompt
  try {
    const retrieval = retrieveCandidateContext(current.prompt)
    const generated = await getLlmClient().generate({
      message: `The candidate (or recruiter exploring Imani's work) answered: "${input.message}". Ask one sharp follow-up grounded in the verified context. Do not grade the answer. Do not invent tools. Stay in interviewer voice, second person is allowed here ("Walk me through...").`,
      mode: 'recruiter',
      context: retrieval.context,
      history: conversation.messages,
      verified: true,
    })
    const spoken = generated.intro.trim()
    if (spoken) question = spoken
  } catch {
    question = next.followUps[asked % next.followUps.length] ?? next.prompt
  }

  const cleaned = question.trim()

  appendMessage(conversation.id, { role: 'assistant', content: cleaned })
  return {
    conversationId: conversation.id,
    track: input.track,
    question: cleaned,
    phase: 'followup',
    sourceId: next.sourceId,
    followUps: [...next.followUps],
  }
}
