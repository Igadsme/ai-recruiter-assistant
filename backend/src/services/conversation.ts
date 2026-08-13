import { randomUUID } from 'node:crypto'
import { AppError, type Conversation, type ConversationMessage } from '../types.ts'

const conversations = new Map<string, Conversation>()
const MAX_MESSAGES = 24
const TTL_MS = 1000 * 60 * 60 * 6

export function createConversation(): Conversation {
  pruneExpired()
  const now = Date.now()
  const conversation: Conversation = {
    id: randomUUID(),
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
  conversations.set(conversation.id, conversation)
  return conversation
}

export function getConversation(id: string): Conversation {
  pruneExpired()
  const conversation = conversations.get(id)
  if (!conversation) {
    throw new AppError(404, 'Conversation not found.', 'conversation_not_found')
  }
  return conversation
}

export function getOrCreateConversation(id?: string): Conversation {
  if (!id) return createConversation()
  return getConversation(id)
}

export function appendMessage(id: string, message: ConversationMessage): Conversation {
  const conversation = getConversation(id)
  conversation.messages.push(message)
  if (conversation.messages.length > MAX_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES)
  }
  conversation.updatedAt = Date.now()
  conversations.set(id, conversation)
  return conversation
}

export function resetConversationsForTests(): void {
  conversations.clear()
}

function pruneExpired(): void {
  const cutoff = Date.now() - TTL_MS
  for (const [id, conversation] of conversations) {
    if (conversation.updatedAt < cutoff) conversations.delete(id)
  }
}
