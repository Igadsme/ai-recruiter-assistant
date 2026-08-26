import { query } from './pool.ts'
import { isVectorEnabled } from './migrate.ts'

export type DocumentRecord = {
  id: string
  kind: string
  title: string
  organization?: string
  body: string
  metadata: Record<string, unknown>
  embedding: number[]
}

type DocumentRow = {
  id: string
  kind: string
  title: string
  organization: string | null
  body: string
  metadata: Record<string, unknown>
  embedding: number[] | string | null
}

export async function upsertDocuments(records: DocumentRecord[]): Promise<void> {
  for (const record of records) {
    await query(
      `INSERT INTO documents (id, kind, title, organization, body, metadata, embedding)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (id) DO UPDATE SET
         kind = EXCLUDED.kind,
         title = EXCLUDED.title,
         organization = EXCLUDED.organization,
         body = EXCLUDED.body,
         metadata = EXCLUDED.metadata,
         embedding = EXCLUDED.embedding`,
      [
        record.id,
        record.kind,
        record.title,
        record.organization ?? null,
        record.body,
        JSON.stringify(record.metadata),
        embeddingParam(record.embedding),
      ],
    )
  }
}

export async function loadDocuments(): Promise<DocumentRecord[]> {
  const result = await query<DocumentRow>(`SELECT id, kind, title, organization, body, metadata, embedding FROM documents`)
  return result.rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    organization: row.organization ?? undefined,
    body: row.body,
    metadata: row.metadata ?? {},
    embedding: parseEmbedding(row.embedding),
  }))
}

function embeddingParam(values: number[]): number[] | string {
  if (isVectorEnabled()) return `[${values.join(',')}]`
  return values
}

function parseEmbedding(value: number[] | string | null): number[] {
  if (Array.isArray(value)) return value.map(Number)
  if (typeof value === 'string') {
    return value
      .replace(/[{}]/g, '')
      .split(',')
      .filter(Boolean)
      .map(Number)
  }
  return []
}
