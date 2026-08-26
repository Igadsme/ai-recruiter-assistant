export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/** Stable Flash model available to new Gemini API keys as of 2026. */
export const DEFAULT_GEMINI_MODEL = 'gemini-flash-lite-latest'

export const GEMINI_MODEL_FALLBACKS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-1.5-flash-lite',
]

export function resolveGeminiModel(raw?: string): string {
  const requested = (raw ?? '').trim().replace(/^models\//, '')
  if (!requested) return DEFAULT_GEMINI_MODEL

  const retired =
    requested.startsWith('gemini-1.5') ||
    requested.startsWith('gemini-2.0') ||
    requested === 'gemini-2.5-flash' ||
    requested === 'gemini-2.5-flash-latest'

  return retired ? DEFAULT_GEMINI_MODEL : requested
}

export const config = {
  get port() {
    return Number(process.env.PORT ?? 3001)
  },
  get host() {
    return this.isProduction ? '0.0.0.0' : '127.0.0.1'
  },
  get nodeEnv() {
    return process.env.NODE_ENV ?? 'development'
  },
  get isProduction() {
    return this.nodeEnv === 'production'
  },
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY ?? ''
  },
  get geminiModel() {
    return resolveGeminiModel(process.env.GEMINI_MODEL)
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL ?? 'http://localhost:5173'
  },
  get geminiTimeoutMs() {
    return Number(process.env.GEMINI_TIMEOUT_MS ?? 40_000)
  },
  get chatRateLimitWindowMs() {
    return Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 60_000)
  },
  get chatRateLimitMax() {
    return Number(process.env.CHAT_RATE_LIMIT_MAX ?? 15)
  },
  get analyticsKey() {
    return process.env.ANALYTICS_KEY ?? ''
  },
  get sessionTtlMs() {
    return Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 6)
  },
  get dataRetentionDays() {
    return Number(process.env.DATA_RETENTION_DAYS ?? 30)
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? ''
  },
  get embeddingModel() {
    return process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001'
  },
  get embeddingDimensions() {
    return Number(process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768)
  },
}
