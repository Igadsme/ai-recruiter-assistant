import { describe, expect, it } from 'vitest'
import { DEFAULT_CHIPS, RECRUITER_CHIPS, isCasualMessage, skipsThinkingState } from '../data'

describe('suggested prompts', () => {
  it('includes a resume chip in both modes', () => {
    expect(DEFAULT_CHIPS.some((chip) => /resume/i.test(chip))).toBe(true)
    expect(RECRUITER_CHIPS.some((chip) => /resume/i.test(chip))).toBe(true)
  })

  it('uses recruiter-oriented prompts in recruiter mode', () => {
    expect(RECRUITER_CHIPS).toContain("Imani Gad's 60-second overview")
    expect(RECRUITER_CHIPS).toContain('Why interview Imani Gad?')
  })

  it('treats hi and how-are-you as casual', () => {
    expect(isCasualMessage('hi')).toBe(true)
    expect(isCasualMessage('How are you?')).toBe(true)
    expect(isCasualMessage('Tell me about Shaw')).toBe(false)
    expect(skipsThinkingState('Who is Imani?')).toBe(true)
    expect(skipsThinkingState('Tell me about Shaw')).toBe(false)
  })
})
