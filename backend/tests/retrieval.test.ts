import { describe, expect, it } from 'vitest'
import { analyzeQuery, retrieveCandidateContext } from '../src/services/retrieval.ts'
import { parseStructuredResponse } from '../src/services/gemini.ts'

describe('analyzeQuery', () => {
  it('classifies an AI question without pulling unrelated cybersecurity-only intent', () => {
    const categories = analyzeQuery('What AI experience does Gad have?')
    expect(categories).toContain('ai')
    expect(categories).not.toContain('cybersecurity')
  })

  it('classifies a resume request', () => {
    expect(analyzeQuery('Can I download the PDF resume?')).toContain('resume')
  })
})

describe('retrieveCandidateContext', () => {
  it('returns Headstarter, DevDash, and the camera project for AI questions', () => {
    const result = retrieveCandidateContext('What AI experience does Gad have?')
    const titles = result.sources.map((source) => `${source.organization ?? ''} ${source.title}`)
    expect(titles.some((title) => /Headstarter/i.test(title))).toBe(true)
    expect(titles.some((title) => /DevDash/i.test(title))).toBe(true)
    expect(titles.some((title) => /Camera/i.test(title))).toBe(true)
    expect(result.context).not.toMatch(/Palo Alto/)
  })

  it('includes Shaw when asked about cybersecurity', () => {
    const result = retrieveCandidateContext('What cybersecurity work has he done?')
    expect(result.sources.some((source) => source.organization === 'Shaw Industries')).toBe(true)
  })

  it('attaches technologies and metrics to experience sources', () => {
    const result = retrieveCandidateContext("What's his software engineering experience?")
    const upcancer = result.sources.find((source) => source.organization === 'UpCancer')
    expect(upcancer?.technologies).toContain('PostgreSQL')
    expect(upcancer?.metrics).toContain('+15% throughput')
  })
})

describe('parseStructuredResponse', () => {
  it('parses JSON from Gemini', () => {
    const parsed = parseStructuredResponse(
      JSON.stringify({
        intro: 'Hello',
        sections: [{ label: 'AI', body: 'RAG work', tags: ['RAG'], metrics: ['5 AI projects'] }],
      }),
    )
    expect(parsed.intro).toBe('Hello')
    expect(parsed.sections[0].tags).toEqual(['RAG'])
  })

  it('extracts spoken text when Gemini uses capital JSON keys', () => {
    const parsed = parseStructuredResponse(
      JSON.stringify({
        Intro: 'I was born in Rwanda.',
        sections: [{ Label: 'WORK', Body: 'I interned at UpCancer.', tags: [] }],
        IsResume: false,
      }),
    )
    expect(parsed.intro).toBe('I was born in Rwanda.')
  })

  it('falls back to plain text when JSON is invalid', () => {
    const parsed = parseStructuredResponse('Imani Gad studied computer science.')
    expect(parsed.intro).toContain('computer science')
    expect(parsed.sections).toEqual([])
  })
})
