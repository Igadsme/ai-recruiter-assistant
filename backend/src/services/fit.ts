import { experience, projects, skills } from '../data/candidate/index.ts'
import { wrapUntrustedData } from './security.ts'
import { normalizeTech } from './retrieval.ts'
import type { FitAnalysis, FitCoverage, FitMatch, FitRequirement } from '../types.ts'

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
  'microsoft sentinel': ['sentinel', 'azure sentinel'],
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
  for (const item of skills.ai) {
    add(item, `Listed under verified AI/ML skills.`, ['skill:ai'], false)
  }
  for (const role of experience) {
    for (const tech of role.technologies) {
      add(tech, `Used as ${role.role} at ${role.organization}.`, [`experience:${role.id}`], true)
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

function coverage(items: FitRequirement[], kind: FitRequirement['kind']): FitCoverage {
  const scoped = items.filter((item) => item.kind === kind)
  const matched = scoped.filter((item) => item.status !== 'missing').length
  const total = scoped.length
  return { matched, total, percent: total === 0 ? 100 : Math.round((matched / total) * 100) }
}

function classifyKind(term: string, jobDescription: string): FitRequirement['kind'] {
  const lower = jobDescription.toLowerCase()
  const index = lower.indexOf(term.toLowerCase())
  if (index === -1) return 'required'
  const window = lower.slice(Math.max(0, index - 180), index + term.length + 80)
  if (/\b(preferred|nice to have|bonus|plus)\b/.test(window)) return 'preferred'
  return 'required'
}

export function analyzeFit(jobDescription: string): FitAnalysis {
  wrapUntrustedData('job description', jobDescription)
  const terms = extractTerms(jobDescription)
  const seen = new Set<string>()
  const strong: FitMatch[] = []
  const partial: FitMatch[] = []
  const missing: string[] = []
  const missingDetails: FitAnalysis['missingDetails'] = []
  const matrix: FitRequirement[] = []

  for (const term of terms) {
    const normalized = normalizeTech(term)
    if (!INTERESTING.has(normalized) && !findRow(term)) continue
    if (seen.has(normalized)) continue
    seen.add(normalized)

    const kind = classifyKind(term, jobDescription)
    const row = findRow(term)
    if (!row) {
      const label = prettyMissing(term)
      missing.push(label)
      missingDetails.push({
        requirement: label,
        notes: 'Not in the verified candidate file. Do not treat this as experience.',
      })
      matrix.push({ requirement: label, kind, status: 'missing', sourceIds: [] })
      continue
    }
    const match = {
      technology: row.name,
      evidence: row.evidence,
      sourceIds: row.sourceIds,
    }
    if (row.demonstrated) {
      strong.push(match)
      matrix.push({
        requirement: row.name,
        kind,
        status: 'strong',
        evidence: row.evidence,
        sourceIds: row.sourceIds,
      })
    } else {
      partial.push(match)
      matrix.push({
        requirement: row.name,
        kind,
        status: 'partial',
        evidence: row.evidence,
        sourceIds: row.sourceIds,
      })
    }
  }

  const relevantProjects = projects
    .map((project) => {
      const overlap = project.technologies.filter(
        (tech) =>
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

  const requiredCoverage = coverage(matrix, 'required')
  const preferredCoverage = coverage(matrix, 'preferred')
  const overallScore = Math.round(requiredCoverage.percent * 0.7 + preferredCoverage.percent * 0.3)

  const transferable = partial.map((item) => ({
    skill: item.technology,
    evidence: `${item.evidence} Adjacent rather than production-proven for this posting.`,
    sourceIds: item.sourceIds,
  }))

  const hiringRisks = [
    missing.length > 0 ? `Missing verified experience with ${missing.slice(0, 3).join(', ')}.` : '',
    'Imani is a December 2026 new-grad candidate — not a senior hire.',
    partial.length > 0
      ? `Some tools (${partial
          .slice(0, 2)
          .map((item) => item.technology)
          .join(', ')}) appear on the skills list without a dedicated production role.`
      : '',
  ].filter(Boolean)

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

  const whyInterview = [
    `Imani is a ${roleHint} candidate with demonstrated work in ${strong.slice(0, 3).map((item) => item.technology).join(', ') || 'software, AI, and automation'}.`,
    missing.length > 0
      ? `Interview to test adjacent strength — do not assume ${missing[0]} experience.`
      : 'The verified file covers the core stack in this posting.',
    relevantProjects[0] ? `${relevantProjects[0].title} is the strongest project overlap.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    roleHint,
    overallScore,
    requiredCoverage,
    preferredCoverage,
    strong,
    partial,
    missing,
    missingDetails,
    transferable,
    relevantProjects,
    interviewQuestions,
    hiringRisks,
    whyInterview,
    requirementMatrix: matrix,
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
