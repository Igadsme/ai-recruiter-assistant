import { describe, expect, it } from 'vitest'
import { DEFAULT_CHIPS, RECRUITER_CHIPS } from '../data'

describe('suggested prompts', () => {
  it('includes a resume chip in both modes', () => {
    expect(DEFAULT_CHIPS.some((chip) => /resume/i.test(chip))).toBe(true)
    expect(RECRUITER_CHIPS.some((chip) => /resume/i.test(chip))).toBe(true)
  })

  it('uses recruiter-oriented prompts in recruiter mode', () => {
    expect(RECRUITER_CHIPS).toContain("Imani Gad's 60-second overview")
    expect(RECRUITER_CHIPS).toContain('Why interview Imani Gad?')
  })
})
