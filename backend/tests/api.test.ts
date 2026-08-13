import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.ts'
import { resetConversationsForTests } from '../src/services/conversation.ts'
import { setLlmClientForTests } from '../src/services/gemini.ts'
import type { LlmClient } from '../src/services/gemini.ts'

const app = createApp()

const mockLlm: LlmClient = {
  generate: vi.fn(async () => ({
    intro: 'Imani Gad is a Computer Science student at Kennesaw State University.',
    sections: [
      {
        label: 'AI EXPERIENCE',
        body: 'He built RAG pipelines during the Headstarter AI fellowship.',
        tags: ['RAG', 'Pinecone', 'Gemini API'],
        metrics: ['5 AI projects'],
      },
    ],
  })),
}

beforeEach(() => {
  resetConversationsForTests()
  setLlmClientForTests(mockLlm)
  vi.clearAllMocks()
})

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('POST /api/chat validation', () => {
  it('rejects an empty message', async () => {
    const response = await request(app).post('/api/chat').send({ message: '   ' })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('validation_error')
  })

  it('rejects a missing message', async () => {
    const response = await request(app).post('/api/chat').send({})
    expect(response.status).toBe(400)
  })

  it('rejects an overly long message', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'a'.repeat(2001) })
    expect(response.status).toBe(400)
  })

  it('rejects an invalid conversationId', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Tell me about Imani', conversationId: 'not-a-uuid' })
    expect(response.status).toBe(400)
  })

  it('rejects an invalid mode', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Tell me about Imani', mode: 'secret' })
    expect(response.status).toBe(400)
  })
})

describe('POST /api/chat', () => {
  it('returns a grounded response with sources', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'What AI experience does Imani Gad have?', mode: 'recruiter' })

    expect(response.status).toBe(200)
    expect(response.body.message).toContain('Imani Gad')
    expect(response.body.conversationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(response.body.sections).toEqual([])
    expect(response.body.sources).toEqual([])
    expect(mockLlm.generate).toHaveBeenCalledTimes(1)
  })

  it('returns a resume card payload without calling Gemini', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'View Imani Gad resume PDF' })

    expect(response.status).toBe(200)
    expect(response.body.isResume).toBe(true)
    expect(response.body.sections.length).toBeGreaterThan(0)
    expect(mockLlm.generate).not.toHaveBeenCalled()
  })

  it('maintains conversation context across follow-ups', async () => {
    const first = await request(app)
      .post('/api/chat')
      .send({ message: 'What AI experience does he have?' })

    const conversationId = first.body.conversationId as string
    await request(app)
      .post('/api/chat')
      .send({ message: 'Which project best demonstrates that?', conversationId })

    expect(mockLlm.generate).toHaveBeenCalledTimes(2)
    const secondCall = vi.mocked(mockLlm.generate).mock.calls[1][0]
    expect(secondCall.history.length).toBeGreaterThan(0)
    expect(secondCall.history[0].content).toContain('AI experience')
  })

  it('returns a safe error when Gemini is unavailable', async () => {
    setLlmClientForTests({
      generate: async () => {
        throw new Error('API key leaked should not appear')
      },
    })

    const response = await request(app).post('/api/chat').send({ message: 'Tell me about Imani Gad' })
    expect(response.status).toBe(503)
    expect(response.body.error.code).toBe('gemini_unavailable')
    expect(JSON.stringify(response.body)).not.toContain('API key leaked')
  })
})

describe('conversations', () => {
  it('creates and fetches a conversation', async () => {
    const created = await request(app).post('/api/conversations')
    expect(created.status).toBe(201)

    const fetched = await request(app).get(`/api/conversations/${created.body.id}`)
    expect(fetched.status).toBe(200)
    expect(fetched.body.id).toBe(created.body.id)
  })

  it('returns 404 for an unknown conversation', async () => {
    const response = await request(app).get('/api/conversations/11111111-1111-4111-8111-111111111111')
    expect(response.status).toBe(404)
  })
})

describe('candidate endpoints', () => {
  it('returns profile, experience, projects, and skills', async () => {
    const [profile, experience, projects, skills] = await Promise.all([
      request(app).get('/api/candidate/profile'),
      request(app).get('/api/candidate/experience'),
      request(app).get('/api/candidate/projects'),
      request(app).get('/api/candidate/skills'),
    ])

    expect(profile.status).toBe(200)
    expect(profile.body.profile.name).toBe('Imani Gad')
    expect(experience.body.experience.length).toBeGreaterThan(0)
    expect(projects.body.projects.some((item: { title: string }) => item.title === 'DevDash')).toBe(true)
    expect(skills.body.skills.languages).toContain('Python')
  })
})
