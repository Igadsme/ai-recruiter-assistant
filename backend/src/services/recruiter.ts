import {
  differentiators,
  education,
  experience,
  projects,
  recruiterBrief,
} from '../data/candidate/index.ts'
import type { DifferentiatorGroup, ProjectDeepDive, RecruiterSummary, Source, StrengthLevel } from '../types.ts'

export function buildFollowUps(query: string, sources: Source[]): string[] {
  const options: string[] = []
  const asked = query.toLowerCase()

  const add = (prompt: string) => {
    if (!prompt) return
    if (asked.includes(prompt.toLowerCase().slice(0, 24))) return
    if (options.includes(prompt)) return
    options.push(prompt)
  }

  for (const source of sources) {
    if (source.type === 'project') add(`Tell me about ${source.title}`)
    if (source.type === 'experience' && source.organization) {
      add(`What did he build at ${source.organization}?`)
    }
  }

  add('What AI projects has Imani worked on?')
  add('What backend experience does he have?')
  add("Show me his strongest project")
  add('Why should I interview Imani Gad?')
  add('Walk me through DevDash architecture')
  add("What's his software engineering experience?")
  add('When does he graduate?')

  return options.slice(0, 4)
}

export function buildRecruiterSummary(sources: Source[]): RecruiterSummary {
  const tech = sources.flatMap((source) => source.technologies ?? []).join(' ')
  const titles = sources.map((source) => `${source.organization ?? ''} ${source.title}`).join(' ')

  return {
    relevantExperience: experience.length >= 5 ? 'High' : 'Moderate',
    aiExperience: levelFrom(
      /headstarter|devdash|camera|pinecone|gemini|openai|yolo|rag/i.test(`${titles} ${tech}`),
      /ai|ml/i.test(tech),
    ),
    backendExperience: levelFrom(
      /upcancer|postgresql|redis|fastapi|servicenow|wellstar/i.test(`${titles} ${tech}`),
      /api|node/i.test(tech),
    ),
    frontendExperience: levelFrom(
      /truespice|react|next\.js/i.test(`${titles} ${tech}`),
      /css|html/i.test(tech),
    ),
    education: `CS — ${education.school.replace(' University', '')}`,
    graduation: education.expectedGraduation.replace('December', 'Dec.'),
    suggestedInterviewTopics: [
      'Python/TypeScript services and Redis-cached PostgreSQL at UpCancer',
      'RAG / Pinecone / Gemini work from the Headstarter fellowship',
      'DevDash: GitHub ingestion plus LLM summarization',
      'Teaching Python to immigrant students at Lutheran Service School',
    ],
  }
}

function levelFrom(strong: boolean, moderate: boolean): StrengthLevel {
  if (strong) return 'Strong'
  if (moderate) return 'Moderate'
  return 'Limited'
}

export function buildDifferentiatorGroups(): DifferentiatorGroup[] {
  return [
    {
      heading: 'Technical',
      items: differentiators.technical.map((item) => ({
        label: item.label,
        evidence: item.evidence,
        sourceIds: [...item.sourceIds],
      })),
    },
    {
      heading: 'Builder',
      items: differentiators.builder.map((item) => ({
        label: item.label,
        evidence: item.evidence,
        sourceIds: [...item.sourceIds],
      })),
    },
    {
      heading: 'Communication',
      items: differentiators.communication.map((item) => ({
        label: item.label,
        evidence: item.evidence,
        sourceIds: [...item.sourceIds],
      })),
    },
  ]
}

export function toProjectDeepDive(projectId: string): ProjectDeepDive | undefined {
  const project = projects.find((item) => item.id === projectId)
  if (!project) return undefined
  return {
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    problem: project.problem,
    solution: project.solution,
    architectureSummary: project.architectureSummary,
    architecture: project.architecture,
    contributed: [...project.contributed],
    challenges: [...project.challenges],
    impact: [...project.impact],
    technologies: [...project.technologies],
    github: project.github,
  }
}

export function briefPayload() {
  return recruiterBrief
}
