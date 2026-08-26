import pg from 'pg'
import { config } from '../config.ts'
import { logger } from '../logger.ts'

const { Pool } = pg

let pool: pg.Pool | null = null

export function isPostgresEnabled(): boolean {
  return Boolean(config.databaseUrl) && process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test'
}

export function getPool(): pg.Pool {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
    })
    pool.on('error', (error) => {
      logger.error({ err: { message: error.message } }, 'postgres pool error')
    })
  }
  return pool
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params)
}

export async function closePool(): Promise<void> {
  if (!pool) return
  await pool.end()
  pool = null
}
