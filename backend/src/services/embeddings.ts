import { config } from '../config.ts'
import { logger } from '../logger.ts'
import { isPostgresEnabled } from '../db/pool.ts'
import { loadDocuments, upsertDocuments, type DocumentRecord } from '../db/documents.ts'

export type EmbeddingVector = number[]

export type EmbeddingsClient = {
  readonly provider: 'gemini' | 'lexical-fallback'
  embed(texts: string[]): Promise<EmbeddingVector[]>
}

const LEXICAL_DIM = 768
const queryCache = new Map<string, EmbeddingVector>()

function fnv1a(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function l2Normalize(vec: number[]): number[] {
  let mag = 0
  for (const value of vec) mag += value * value
  const denom = Math.sqrt(mag) || 1
  return vec.map((value) => value / denom)
}

/** Offline fallback used in tests when Gemini is not configured. Production uses Gemini embeddings. */
export function lexicalEmbedding(text: string, dim = LEXICAL_DIM): EmbeddingVector {
  const vec = new Array<number>(dim).fill(0)
  const normalized = text.toLowerCase()
  const n = 3
  for (let i = 0; i <= normalized.length - n; i++) {
    vec[fnv1a(normalized.slice(i, i + n)) % dim] += 1
  }
  return l2Normalize(vec)
}

export class LexicalEmbeddingsClient implements EmbeddingsClient {
  readonly provider = 'lexical-fallback' as const
  async embed(texts: string[]): Promise<EmbeddingVector[]> {
    return texts.map((text) => lexicalEmbedding(text, config.embeddingDimensions))
  }
}

export class GeminiEmbeddingsClient implements EmbeddingsClient {
  readonly provider = 'gemini' as const
  private client: {
    models: { embedContent: (request: Record<string, unknown>) => Promise<{ embeddings?: Array<{ values?: number[] }> }> }
  } | null = null

  constructor(private readonly apiKey = config.geminiApiKey) {}

  async embed(texts: string[]): Promise<EmbeddingVector[]> {
    if (!this.client) {
      const { GoogleGenAI } = await import('@google/genai')
      this.client = new GoogleGenAI({ apiKey: this.apiKey }) as unknown as NonNullable<typeof this.client>
    }
    const vectors: EmbeddingVector[] = []
    for (const text of texts) {
      const response = await this.client.models.embedContent({
        model: config.embeddingModel,
        contents: text,
        config: { outputDimensionality: config.embeddingDimensions },
      })
      const values = response.embeddings?.[0]?.values
      if (!values?.length) {
        throw new Error('empty embedding')
      }
      vectors.push(l2Normalize(values))
    }
    return vectors
  }
}

let embeddingsClient: EmbeddingsClient | null = null

export function getEmbeddingsClient(): EmbeddingsClient {
  if (embeddingsClient) return embeddingsClient
  const test = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
  if (test || !config.geminiApiKey) {
    embeddingsClient = new LexicalEmbeddingsClient()
    if (!test && !config.geminiApiKey) {
      logger.warn('GEMINI_API_KEY missing; using lexical embedding fallback')
    }
    return embeddingsClient
  }
  embeddingsClient = new GeminiEmbeddingsClient()
  return embeddingsClient
}

export function setEmbeddingsClientForTests(client: EmbeddingsClient | null): void {
  embeddingsClient = client
}

export async function embedQuery(text: string): Promise<EmbeddingVector> {
  const cached = queryCache.get(text)
  if (cached) return cached
  const [vector] = await getEmbeddingsClient().embed([text])
  if (queryCache.size > 200) queryCache.clear()
  queryCache.set(text, vector)
  return vector
}

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  let dot = 0
  let magA = 0
  let magB = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export async function persistDocumentEmbeddings(records: DocumentRecord[]): Promise<void> {
  if (!isPostgresEnabled() || records.length === 0) return
  await upsertDocuments(records)
}

export async function restoreDocumentEmbeddings(): Promise<DocumentRecord[]> {
  if (!isPostgresEnabled()) return []
  try {
    return await loadDocuments()
  } catch {
    return []
  }
}
