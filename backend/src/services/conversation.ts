import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AppError, emptySession, type Conversation, type ConversationMessage, type RecruiterSession, type Source } from '../types.ts'
import { config } from '../config.ts'
import { isPostgresEnabled } from '../db/pool.ts'
import {
  insertSession,
  loadSession,
  pruneExpiredSessions,
  replaceMessages,
  saveSession,
} from '../db/sessions.ts'

const conversations = new Map<string, Conversation>()
const MAX_MESSAGES = 24
const storePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.data/conversations.json')
let loaded = false

function isTest(): boolean {
  return process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
}

export async function createConversation(): Promise<Conversation> {
  await pruneExpired()
  const now = Date.now()
  const conversation: Conversation = {
    id: randomUUID(),
    messages: [],
    session: emptySession(),
    createdAt: now,
    updatedAt: now,
  }
  conversations.set(conversation.id, conversation)
  if (isPostgresEnabled()) {
    await insertSession(conversation)
  } else {
    persistJson()
  }
  return conversation
}

export async function getConversation(id: string): Promise<Conversation> {
  await pruneExpired()
  const cached = conversations.get(id)
  if (cached) return cached
  if (isPostgresEnabled()) {
    const loadedSession = await loadSession(id)
    if (loadedSession) {
      conversations.set(id, loadedSession)
      return loadedSession
    }
  }
  throw new AppError(404, 'Conversation not found.', 'conversation_not_found')
}

export async function getOrCreateConversation(id?: string): Promise<Conversation> {
  if (!id) return createConversation()
  return getConversation(id)
}

export async function appendMessage(id: string, message: ConversationMessage): Promise<Conversation> {
  const conversation = await getConversation(id)
  conversation.messages.push(message)
  if (conversation.messages.length > MAX_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES)
  }
  conversation.updatedAt = Date.now()
  conversations.set(id, conversation)
  await persistConversation(conversation)
  return conversation
}

export async function patchSession(id: string, patch: Partial<RecruiterSession>): Promise<RecruiterSession> {
  const conversation = await getConversation(id)
  conversation.session = { ...conversation.session, ...patch }
  conversation.updatedAt = Date.now()
  conversations.set(id, conversation)
  await persistConversation(conversation)
  return conversation.session
}

export async function recordRetrievalOnSession(id: string, sources: Source[], query: string): Promise<RecruiterSession> {
  const conversation = await getConversation(id)
  const interests = new Set(conversation.session.interests)
  const projectsViewed = new Set(conversation.session.projectsViewed)
  const experienceViewed = new Set(conversation.session.experienceViewed)

  for (const source of sources) {
    if (source.type === 'project') {
      projectsViewed.add(source.title)
      interests.add('Projects')
      if (/ai|llm|rag|gemini|yolo|openai/i.test(`${source.title} ${source.relevantExcerpt ?? ''}`)) {
        interests.add('AI/ML')
      }
    }
    if (source.type === 'experience') {
      experienceViewed.add(source.organization ?? source.title)
      interests.add('Experience')
      if (/python|postgres|redis|api|fastapi|node/i.test((source.technologies ?? []).join(' '))) {
        interests.add('Backend')
      }
    }
    if (source.type === 'education') interests.add('Education')
  }

  if (/\b(backend|api|postgres)\b/i.test(query)) interests.add('Backend')
  if (/\b(ai|ml|llm|rag)\b/i.test(query)) interests.add('AI/ML')
  if (/\b(new grad|entry|intern|swe)\b/i.test(query)) interests.add('Entry-level SWE')
  if (/\bresume|cv\b/i.test(query)) conversation.session.resumeViewed = true

  const exploring = [...interests].slice(-2).join(' / ') || 'Overview'
  conversation.session = {
    ...conversation.session,
    interests: [...interests],
    questionsAsked: conversation.session.questionsAsked + 1,
    projectsViewed: [...projectsViewed],
    experienceViewed: [...experienceViewed],
    exploring,
  }
  conversation.updatedAt = Date.now()
  conversations.set(id, conversation)
  await persistConversation(conversation)
  return conversation.session
}

export function resetConversationsForTests(): void {
  conversations.clear()
  loaded = true
}

async function persistConversation(conversation: Conversation): Promise<void> {
  if (isPostgresEnabled()) {
    await saveSession(conversation)
    await replaceMessages(conversation.id, conversation.messages)
    return
  }
  persistJson()
}

async function pruneExpired(): Promise<void> {
  await loadJson()
  if (isPostgresEnabled()) {
    await pruneExpiredSessions()
  }
  const cutoff = Date.now() - config.sessionTtlMs
  for (const [id, conversation] of conversations) {
    if (conversation.updatedAt < cutoff) conversations.delete(id)
  }
}

async function loadJson(): Promise<void> {
  if (loaded) return
  loaded = true
  if (isTest() || isPostgresEnabled()) return
  try {
    const raw = fs.readFileSync(storePath, 'utf8')
    const parsed = JSON.parse(raw) as { conversations?: Conversation[] }
    for (const conversation of parsed.conversations ?? []) {
      conversations.set(conversation.id, conversation)
    }
  } catch {
    // First boot.
  }
}

function persistJson(): void {
  if (isTest() || isPostgresEnabled()) return
  try {
    fs.mkdirSync(path.dirname(storePath), { recursive: true })
    fs.writeFileSync(storePath, JSON.stringify({ conversations: [...conversations.values()] }))
  } catch {
    // Best-effort on ephemeral hosts without DATABASE_URL.
  }
}
