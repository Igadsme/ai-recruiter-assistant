import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type AnalyticsEventType =
  | 'portfolio_visit'
  | 'chat_started'
  | 'question_asked'
  | 'project_viewed'
  | 'resume_viewed'
  | 'resume_downloaded'
  | 'github_clicked'
  | 'contact_clicked'
  | 'fit_analyzed'
  | 'interview_started'

export type AnalyticsEvent = {
  type: AnalyticsEventType
  at: number
  query?: string
  conversationId?: string
}

type AnalyticsStore = {
  events: AnalyticsEvent[]
}

const MAX_EVENTS = 5000
const storePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.data/analytics.json')

let memory: AnalyticsStore = { events: [] }
let loaded = false

function persist(): void {
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') return
  try {
    fs.mkdirSync(path.dirname(storePath), { recursive: true })
    fs.writeFileSync(storePath, JSON.stringify(memory, null, 0))
  } catch {
    // File persistence is best-effort on ephemeral hosts.
  }
}

export function trackEvent(event: Omit<AnalyticsEvent, 'at'> & { at?: number }): AnalyticsEvent {
  const store = load()
  const recorded: AnalyticsEvent = { ...event, at: event.at ?? Date.now() }
  store.events.push(recorded)
  if (store.events.length > MAX_EVENTS) {
    store.events = store.events.slice(-MAX_EVENTS)
  }
  persist()
  return recorded
}

function load(): AnalyticsStore {
  if (loaded) return memory
  loaded = true
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    memory = { events: [] }
    return memory
  }
  try {
    const raw = fs.readFileSync(storePath, 'utf8')
    const parsed = JSON.parse(raw) as AnalyticsStore
    if (Array.isArray(parsed.events)) memory = parsed
  } catch {
    memory = { events: [] }
  }
  return memory
}

export function analyticsSummary(days = 7) {
  const store = load()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const recent = store.events.filter((event) => event.at >= cutoff)
  const count = (type: AnalyticsEventType) => recent.filter((event) => event.type === type).length

  const questions = recent
    .filter((event) => event.type === 'question_asked' && event.query)
    .reduce<Record<string, number>>((acc, event) => {
      const key = event.query!.trim()
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

  const mostAsked = Object.entries(questions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([query, count]) => ({ query, count }))

  return {
    windowDays: days,
    totals: {
      visitors: count('portfolio_visit'),
      chatStarted: count('chat_started'),
      questions: count('question_asked'),
      resumeViewed: count('resume_viewed'),
      resumeDownloaded: count('resume_downloaded'),
      projectViewed: count('project_viewed'),
      githubClicked: count('github_clicked'),
      contactClicked: count('contact_clicked'),
      fitAnalyzed: count('fit_analyzed'),
      interviewStarted: count('interview_started'),
    },
    mostAsked,
    recent: recent.slice(-25).reverse(),
  }
}

export function resetAnalyticsForTests(): void {
  memory = { events: [] }
  loaded = true
}
