import { experience, projects, skills } from '../data/candidate/index.ts'
import { normalizeTech } from './retrieval.ts'
import type { FitAnalysis, FitMatch } from '../types.ts'

type InventoryRow = {
  name: string
  normalized: string
  evidence: string
  sourceIds: string[]
  demonstrated: boolean
}

const ALIASES: Record<string, string[]> = {
  postgresql: ['postgres', 'psql', 'sql'],
  javascript: ['js', 'node', 'nodejs'],
  typescript: ['ts'],
  'node.js': ['node', 'nodejs'],
  'next.js': ['nextjs', 'next'],
  react: ['reactjs'],
  kubernetes: ['k8s'],
  'rest apis': ['rest', 'api', 'apis'],
}

function inventory(): InventoryRow[] {
  const rows: InventoryRow[] = []

  const add = (name: string, evidence: string, sourceIds: string[], demonstrated: boolean) => {
    const normalized = normalizeTech(name)
    const existing = rows.find((row) => row.normalized === normalized)
    if (existing) {
      if (demonstrated) existing.demonstrated = true
      existing.sourceIds = [...new Set([...existing.sourceIds, ...sourceIds])]
      if (demonstrated) existing.evidence = evidence
      return
    }
    rows.push({ name, normalized, evidence, sourceIds, demonstrated })
  }

  for (const language of skills.languages) {
    add(language, `Listed under verified languages.`, ['skill:languages'], false)
  }
  for (const framework of skills.frameworks) {
    add(framework, `Listed under verified frameworks.`, ['skill:frameworks'], false)
  }
  for (const tool of skills.tools) {
    add(tool, `Listed under verified tools.`, ['skill:tools'], false)
  }
  for (const role of experience) {
    for (const tech of role.technologies) {
      add(
        tech,
        `Used as ${role.role} at ${role.organization}.`,
        [`experience:${role.id}`],
        true,
      )
    }
  }
  for (const project of projects) {
    for (const tech of project.technologies) {
      add(tech, `Used on ${project.title}.`, [`project:${project.id}`], true)
    }
  }
  return rows
}

const INVENTORY = inventory()

function extractTerms(jobDescription: string): string[] {
  const raw = [...jobDescription.matchAll(/[A-Za-z][A-Za-z0-9+#.]{1,24}/g)].map((match) => match[0])
  const extra: string[] = []
  const lower = jobDescription.toLowerCase()
  if (/\bnode(\.?js)?\b/i.test(jobDescription)) extra.push('Node.js')
  if (/\bnext(\.?js)?\b/i.test(jobDescription)) extra.push('Next.js')
  if (/\bpostgres(ql)?\b/i.test(jobDescription)) extra.push('PostgreSQL')
  if (/\bk8s\b/.test(lower) || /kubernetes/.test(lower)) extra.push('Kubernetes')
  if (/\brest\b/.test(lower)) extra.push('REST APIs')
  return [...raw, ...extra]
}

function findRow(term: string): InventoryRow | undefined {
  const normalized = normalizeTech(term)
  const direct = INVENTORY.find((row) => row.normalized === normalized)
  if (direct) return direct
  return INVENTORY.find((row) => {
    const aliases = ALIASES[row.name.toLowerCase()] ?? []
    return aliases.some((alias) => normalizeTech(alias) === normalized)
  })
}

const INTERESTING = new Set(
  [
    ...INVENTORY.map((row) => row.normalized),
    'kubernetes',
    'k8s',
    'terraform',
    'ansible',
    'graphql',
    'kafka',
    'spark',
    'golang',
    'go',
    'rust',
    'django',
    'spring',
    'vue',
    'svelte',
    'azure',
    'gcp',
    'helm',
  ],
)

export function analyzeFit(jobDescription: string): FitAnalysis {
  const terms = extractTerms(jobDescription)
  const seen = new Set<string>()
  const strong: FitMatch[] = []
  const partial: FitMatch[] = []
  const missing: string[] = []

  for (const term of terms) {
    const normalized = normalizeTech(term)
    if (!INTERESTING.has(normalized) && !findRow(term)) continue
    if (seen.has(normalized)) continue
    seen.add(normalized)

    const row = findRow(term)
    if (!row) {
      missing.push(prettyMissing(term))
      continue
    }
    const match = {
      technology: row.name,
      evidence: row.evidence,
      sourceIds: row.sourceIds,
    }
    if (row.demonstrated) strong.push(match)
    else partial.push(match)
  }

  const relevantProjects = projects
    .map((project) => {
      const overlap = project.technologies.filter((tech) =>
        strong.some((item) => item.technology.toLowerCase() === tech.toLowerCase()) ||
        partial.some((item) => item.technology.toLowerCase() === tech.toLowerCase()),
      )
      return {
        id: project.id,
        title: project.title,
        reason:
          overlap.length > 0
            ? `Overlaps the posting on ${overlap.join(', ')}.`
            : `Independent AI/full-stack project in the candidate file.`,
        score: overlap.length,
      }
    })
    .sort((a, b) => b.score - a.score)
    .map(({ id, title, reason }) => ({ id, title, reason }))

  const roleHint = inferRoleHint(jobDescription)
  const interviewQuestions = [
    strong.some((item) => /python/i.test(item.technology))
      ? 'Walk through the Python/TypeScript services at UpCancer. Where did Redis sit relative to PostgreSQL?'
      : 'Walk through a backend service he actually shipped — start with UpCancer or Wellstar.',
    relevantProjects[0]
      ? `You mentioned ${relevantProjects[0].title}. Why that architecture, and what would you change at 10× load?`
      : 'Walk through DevDash: GitHub ingestion to LLM summarization.',
    missing.length > 0
      ? `The posting lists ${missing[0]}, which is not in the verified file. What adjacent experience (Docker, AWS, APIs) would you probe instead?`
      : 'How did he evaluate RAG quality during the Headstarter fellowship?',
  ]

  return {
    roleHint,
    strong,
    partial,
    missing,
    relevantProjects,
    interviewQuestions,
  }
}

function prettyMissing(term: string): string {
  if (/^k8s$/i.test(term)) return 'Kubernetes'
  return term
}

function inferRoleHint(jobDescription: string): string {
  const firstLine = jobDescription.split('\n').map((line) => line.trim()).find(Boolean) ?? 'Software Engineer'
  return firstLine.slice(0, 80)
}
