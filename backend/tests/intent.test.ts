import { describe, expect, it } from 'vitest'
import {
  classifyConversationIntent,
  conversationalReply,
  introductionReply,
  needsLlm,
  needsRetrieval,
} from '../src/services/intent.ts'

describe('classifyConversationIntent', () => {
  it('treats greetings as greetings', () => {
    expect(classifyConversationIntent('hi')).toBe('greeting')
    expect(classifyConversationIntent('Hi!')).toBe('greeting')
    expect(classifyConversationIntent('hey there')).toBe('greeting')
    expect(classifyConversationIntent('hello')).toBe('greeting')
  })

  it('treats how-are-you as small talk', () => {
    expect(classifyConversationIntent('How are you?')).toBe('small_talk')
    expect(classifyConversationIntent("hi, how's it going")).toBe('small_talk')
  })

  it('introduces Imani without treating named roles as bios', () => {
    expect(classifyConversationIntent('Who is Imani?')).toBe('introduction')
    expect(classifyConversationIntent('Tell me about Imani Gad')).toBe('introduction')
    expect(classifyConversationIntent('Tell me about Shaw')).toBe('experience')
  })

  it('routes hiring, proof, and resume questions', () => {
    expect(classifyConversationIntent('Why should we hire him?')).toBe('why_hire')
    expect(classifyConversationIntent('Show me proof')).toBe('proof')
    expect(classifyConversationIntent('Show me his résumé')).toBe('resume')
  })

  it('keeps a greeting plus a real question on the question', () => {
    expect(classifyConversationIntent('Hi, tell me about Shaw')).toBe('experience')
  })
})

describe('conversational replies', () => {
  it('greets as Imani’s assistant without a résumé dump', () => {
    const reply = conversationalReply('greeting', 0)
    expect(reply).toMatch(/Imani's AI assistant/)
    expect(reply).toMatch(/experience, projects, skills/)
    expect(needsRetrieval('greeting')).toBe(false)
    expect(needsLlm('greeting')).toBe(false)
  })

  it('keeps an introduction to two or three sentences', () => {
    const reply = introductionReply()
    expect(reply.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3)
    expect(reply).toMatch(/Kennesaw State University/)
    expect(needsRetrieval('introduction')).toBe(false)
  })
})
