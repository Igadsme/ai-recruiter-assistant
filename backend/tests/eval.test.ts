import { describe, expect, it } from 'vitest'
import { EVAL_QUESTIONS } from '../eval/questions.ts'
import { classifyConversationIntent, isConversationalIntent, needsRetrieval } from '../src/services/intent.ts'
import { detectPromptInjection } from '../src/services/security.ts'
import { retrieveCandidateContext } from '../src/services/retrieval.ts'
import { analyzeFit } from '../src/services/fit.ts'
import { resolveFollowUpQuery } from '../src/services/followUp.ts'

describe('evaluation suite', () => {
  it('contains at least 100 questions across the required categories', () => {
    expect(EVAL_QUESTIONS.length).toBeGreaterThanOrEqual(100)
    const categories = new Set(EVAL_QUESTIONS.map((item) => item.category))
    expect(categories.size).toBe(10)
  })

  it('routes greetings, sensitive, resume, and injection prompts safely', () => {
    for (const question of EVAL_QUESTIONS) {
      if (question.category === 'prompt_injection') {
        expect(detectPromptInjection(question.query)).toBe(true)
        continue
      }
      const intent = classifyConversationIntent(question.query)
      if (question.category === 'greeting') {
        expect(['greeting', 'small_talk', 'thanks', 'assistant']).toContain(intent)
        expect(needsRetrieval(intent)).toBe(false)
      }
      if (question.category === 'sensitive') expect(intent).toBe('sensitive')
      if (question.category === 'resume') expect(intent).toBe('resume')
      if (question.category === 'ambiguous') expect(intent).toBe('vague')
      if (question.category === 'job_fit') expect(['fit_analysis', 'experience', 'candidate', 'projects', 'skills']).toContain(intent)
    }
  })

  it('retrieves the expected employers for factual questions', () => {
    for (const question of EVAL_QUESTIONS.filter((item) => item.mustRetrieve?.length)) {
      const result = retrieveCandidateContext(question.query)
      const blob = result.sources.map((source) => `${source.organization ?? ''} ${source.title}`).join(' ')
      for (const needle of question.mustRetrieve ?? []) {
        expect(blob).toMatch(new RegExp(needle, 'i'))
      }
    }
  })

  it('resolves a follow-up like “what did he build there?” using Shaw history', () => {
    const resolved = resolveFollowUpQuery('What did he build there?', [
      { role: 'user', content: 'Tell me about Shaw' },
      { role: 'assistant', content: 'Imani was a Cybersecurity Co-op at Shaw Industries.' },
    ])
    expect(resolved).toMatch(/Shaw/)
  })

  it('never marks Kubernetes as a demonstrated match', () => {
    const analysis = analyzeFit(
      'Software Engineer — Python, AWS, React, PostgreSQL, Docker, TypeScript, Kubernetes, Terraform',
    )
    expect(analysis.missing).toEqual(expect.arrayContaining(['Kubernetes', 'Terraform']))
    expect(analysis.strong.map((item) => item.technology)).not.toEqual(expect.arrayContaining(['Kubernetes']))
    expect(analysis.overallScore).toBeGreaterThan(0)
    expect(analysis.whyInterview.length).toBeGreaterThan(20)
  })

  it('keeps conversational intents off the retrieval path', () => {
    expect(isConversationalIntent('greeting')).toBe(true)
    expect(needsRetrieval('greeting')).toBe(false)
    expect(needsRetrieval('vague')).toBe(false)
    expect(needsRetrieval('sensitive')).toBe(false)
  })

  it('returns no sources for an unknown employer', () => {
    const result = retrieveCandidateContext('Did he intern at Google?')
    expect(result.insufficient).toBe(true)
    expect(result.sources).toEqual([])
  })
})
