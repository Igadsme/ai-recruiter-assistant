import { query } from './pool.ts'
import type { AnalyticsEvent, AnalyticsEventType } from '../services/analytics.ts'

type EventRow = {
  type: AnalyticsEventType
  query: string | null
  session_id: string | null
  created_at: Date
}

export async function insertAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  await query(
    `INSERT INTO analytics_events (type, query, session_id, created_at)
     VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))`,
    [event.type, event.query ?? null, event.conversationId ?? null, event.at],
  )
}

export async function loadAnalyticsEvents(sinceMs: number): Promise<AnalyticsEvent[]> {
  const result = await query<EventRow>(
    `SELECT type, query, session_id, created_at FROM analytics_events
     WHERE created_at >= to_timestamp($1 / 1000.0)
     ORDER BY created_at ASC`,
    [sinceMs],
  )
  return result.rows.map((row) => ({
    type: row.type,
    query: row.query ?? undefined,
    conversationId: row.session_id ?? undefined,
    at: new Date(row.created_at).getTime(),
  }))
}
