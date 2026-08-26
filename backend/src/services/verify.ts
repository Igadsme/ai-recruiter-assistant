import type { EvidenceClaim, Source } from '../types.ts'

const CLAIM_CUES =
  /\b(built|developed|interned|used|shipped|reduced|increased|graduating|student|project|co-op|fellow|mentored)\b/i

export function verifyClaims(answer: string, sources: Source[]): { claims: EvidenceClaim[]; unsupportedRate: number } {
  const sentences = answer
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 20 && CLAIM_CUES.test(item))

  if (sentences.length === 0) {
    return { claims: [], unsupportedRate: 0 }
  }

  const haystack = sources
    .map((source) =>
      [source.title, source.organization, source.relevantExcerpt, ...(source.technologies ?? [])].join(' ').toLowerCase(),
    )
    .join('\n')

  const claims = sentences.map((sentence) => {
    const tokens = tokenize(sentence).filter((token) => token.length > 3)
    const hits = tokens.filter((token) => haystack.includes(token))
    const supported = tokens.length === 0 ? true : hits.length / tokens.length >= 0.28
    const source = sources.find((item) =>
      tokenize(`${item.title} ${item.organization ?? ''} ${item.relevantExcerpt ?? ''}`).some((token) =>
        sentence.toLowerCase().includes(token),
      ),
    )
    return {
      claim: sentence,
      supported,
      organization: source?.organization,
      title: source?.title,
      technologies: source?.technologies,
      sourceIds: source?.id ? [source.id] : sources.slice(0, 2).map((item) => item.id),
    }
  })

  const unsupported = claims.filter((claim) => !claim.supported).length
  return { claims, unsupportedRate: unsupported / claims.length }
}

export function insufficientEvidenceReply(): string {
  return "I don't have verified information about that."
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1)
}
