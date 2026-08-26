import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isPostgresEnabled, query } from './pool.ts'
import { logger } from '../logger.ts'
import { config } from '../config.ts'

let vectorEnabled = false

export function isVectorEnabled(): boolean {
  return vectorEnabled
}

export async function migrate(): Promise<void> {
  if (!isPostgresEnabled()) return

  const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')
  const statements = sql
    .split(/;\s*\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !item.startsWith('--'))

  for (const statement of statements) {
    try {
      await query(statement)
      if (/CREATE EXTENSION IF NOT EXISTS vector/i.test(statement)) vectorEnabled = true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/extension "vector"/i.test(message) || /type "vector" does not exist/i.test(message) || /operator class "vector_cosine_ops"/i.test(message)) {
        logger.warn('pgvector extension unavailable; using float8[] embeddings')
        vectorEnabled = false
        await query(`
          CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL,
            title TEXT NOT NULL,
            organization TEXT,
            body TEXT NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            embedding FLOAT8[]
          )
        `)
        continue
      }
      throw error
    }
  }

  logger.info({ retentionDays: config.dataRetentionDays, vectorEnabled }, 'postgres schema ready')
}
