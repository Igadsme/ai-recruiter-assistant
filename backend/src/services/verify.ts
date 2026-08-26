import type { EvidenceClaim, Source } from '../types.ts'

export function validateStructuredClaims(
  claims: Array<{ text?: string; claim?: string; sourceIds?: string[] }>,
  sources: Source[],
): { claims: EvidenceClaim[]; unsupportedRate: number } {
  const byId = new Map(sources.map((source) => [source.id, source]))
  const validated = claims
    .map((item) => {
      const text = String(item.text ?? item.claim ?? '').trim()
      const sourceIds = Array.isArray(item.sourceIds) ? item.sourceIds.filter(Boolean) : []
      return validateClaim(text, sourceIds, byId)
    })
    .filter((item) => item.claim.length > 0)

  if (validated.length === 0) return { claims: [], unsupportedRate: 0 }
  const unsupported = validated.filter((item) => !item.supported).length
  return { claims: validated, unsupportedRate: unsupported / validated.length }
}

export function validateClaim(text: string, sourceIds: string[], byId: Map<string, Source>): EvidenceClaim {
  const cited = sourceIds.map((id) => byId.get(id)).filter((item): item is Source => Boolean(item))
  const supported = cited.length > 0 && cited.every((source) => sourceSupportsClaim(source, text))
  const source = cited[0]
  return {
    claim: text,
    supported,
    organization: source?.organization,
    title: source?.title,
    technologies: source?.technologies,
    sourceIds: cited.map((item) => item.id),
  }
}

export function sourceSupportsClaim(source: Source, claim: string): boolean {
  const haystack = [
    source.title,
    source.organization,
    source.relevantExcerpt,
    ...(source.technologies ?? []),
    ...(source.metrics ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const tokens = tokenize(claim).filter((token) => token.length > 3 && !GENERIC.has(token))
  if (tokens.length === 0) return citedHasEntity(haystack, claim)
  const hits = tokens.filter((token) => haystack.includes(token))
  return hits.length / tokens.length >= 0.4 && citedHasEntity(haystack, claim)
}

function citedHasEntity(haystack: string, claim: string): boolean {
  const entities = ['shaw', 'upcancer', 'wellstar', 'headstarter', 'truespice', 'lutheran', 'devdash', 'camera', 'kennesaw']
  const mentioned = entities.filter((entity) => claim.toLowerCase().includes(entity))
  if (mentioned.length === 0) return true
  return mentioned.some((entity) => haystack.includes(entity))
}

export function insufficientEvidenceReply(): string {
  return "I don't have verified information about that."
}

const GENERIC = new Set(['imani', 'gad', 'with', 'from', 'that', 'this', 'have', 'been', 'into', 'using'])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1)
}
