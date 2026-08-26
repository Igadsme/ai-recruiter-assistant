import { randomUUID } from 'node:crypto'
import { query } from './pool.ts'
import { config } from '../config.ts'
import { emptySession, type Conversation, type ConversationMessage, type RecruiterSession } from '../types.ts'

type SessionRow = {
  id: string
  created_at: Date
  updated_at: Date
  session: RecruiterSession
}

type MessageRow = {
  role: 'user' | 'assistant'
  content: string
}

export async function insertSession(conversation: Conversation, ipAnonymized?: string): Promise<void> {
  await query(
    `INSERT INTO sessions (id, created_at, updated_at, expires_at, ip_anonymized, session)
     VALUES ($1, to_timestamp($2 / 1000.0), to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0), $5, $6::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [
      conversation.id,
      conversation.createdAt,
      conversation.updatedAt,
      conversation.updatedAt + config.sessionTtlMs,
      ipAnonymized ?? null,
      JSON.stringify(conversation.session),
    ],
  )
}

export async function loadSession(id: string): Promise<Conversation | null> {
  const sessionResult = await query<SessionRow>(
    `SELECT id, created_at, updated_at, session FROM sessions WHERE id = $1 AND expires_at > now()`,
    [id],
  )
  const row = sessionResult.rows[0]
  if (!row) return null

  const messages = await query<MessageRow>(
    `SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [id],
  )

  return {
    id: row.id,
    messages: messages.rows.map((item) => ({ role: item.role, content: item.content })),
    session: { ...emptySession(), ...row.session },
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

export async function saveSession(conversation: Conversation): Promise<void> {
  await query(
    `INSERT INTO sessions (id, created_at, updated_at, expires_at, session)
     VALUES ($1, to_timestamp($2 / 1000.0), to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0), $5::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       updated_at = EXCLUDED.updated_at,
       expires_at = EXCLUDED.expires_at,
       session = EXCLUDED.session`,
    [
      conversation.id,
      conversation.createdAt,
      conversation.updatedAt,
      conversation.updatedAt + config.sessionTtlMs,
      JSON.stringify(conversation.session),
    ],
  )
}

export async function replaceMessages(id: string, messages: ConversationMessage[]): Promise<void> {
  await query(`DELETE FROM messages WHERE session_id = $1`, [id])
  for (const message of messages) {
    await query(`INSERT INTO messages (id, session_id, role, content) VALUES ($1, $2, $3, $4)`, [
      randomUUID(),
      id,
      message.role,
      message.content,
    ])
  }
}

export async function pruneExpiredSessions(): Promise<void> {
  await query(`DELETE FROM sessions WHERE expires_at < now()`)
  await query(
    `DELETE FROM analytics_events WHERE created_at < now() - ($1 || ' days')::interval`,
    [String(config.dataRetentionDays)],
  )
}
