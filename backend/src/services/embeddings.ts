const DIM = 256

export type EmbeddingVector = number[]

export function embedText(text: string): EmbeddingVector {
  const vec = new Array<number>(DIM).fill(0)
  const normalized = text.toLowerCase()
  const n = 3
  for (let i = 0; i <= normalized.length - n; i++) {
    const gram = normalized.slice(i, i + n)
    vec[fnv1a(gram) % DIM] += 1
  }
  return l2Normalize(vec)
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
