export type ChatMode = 'general' | 'recruiter'

export type Source = {
  id?: string
  type: string
  category?: string
  title: string
  organization?: string
  date?: string
  technologies?: string[]
  metrics?: string[]
  relevantExcerpt?: string
  verified?: boolean
}

export type ChatSection = {
  label: string
  body: string
  tags: string[]
  metrics?: string[]
}

export type RetrievalStage = {
  id: string
  label: string
  status: 'pending' | 'done' | 'skipped'
}

export type RecruiterSummary = {
  relevantExperience: string
  aiExperience: string
  backendExperience: string
  frontendExperience: string
  education: string
  graduation: string
  suggestedInterviewTopics: string[]
}

export type DifferentiatorGroup = {
  heading: string
  items: Array<{ label: string; evidence: string; sourceIds: string[] }>
}

export type ProjectDeepDive = {
  id: string
  title: string
  subtitle: string
  problem: string
  solution: string
  architectureSummary: string
  architecture: {
    nodes: Array<{ id: string; label: string; detail: string; row: number; column: number }>
    edges: Array<{ from: string; to: string }>
  }
  contributed: string[]
  challenges: string[]
  impact: string[]
  technologies: string[]
  github?: string
}

export type RecruiterSession = {
  interests: string[]
  questionsAsked: number
  projectsViewed: string[]
  experienceViewed: string[]
  resumeViewed: boolean
  resumeDownloaded: boolean
  githubClicked: boolean
  contactClicked: boolean
  exploring: string
}

export type ChatApiResponse = {
  message: string
  sections: ChatSection[]
  sources: Source[]
  conversationId: string
  isResume?: boolean
  verified?: boolean
  verificationNote?: string
  followUps?: string[]
  retrievalStages?: RetrievalStage[]
  recruiterSummary?: RecruiterSummary
  projectDeepDive?: ProjectDeepDive
  differentiators?: DifferentiatorGroup[]
  showContactCta?: boolean
  session?: RecruiterSession
  intent?: string
  conversational?: boolean
  revealSources?: boolean
}

export type RecruiterBrief = {
  candidate: string
  title: string
  education: string
  graduation: string
  focus: string[]
  coreTechnologies: string[]
  relevantExperienceCount: number
  relevantExperienceLabel: string
  aiProjectCount: number
  bestFitRoles: string[]
  availability: string
  email: string
  phone: string
  linkedin: string
  github: string
}

export type TimelineNode = {
  id: string
  year: string
  title: string
  organization: string
  detail: string
  sourceId: string
}

export type FitAnalysis = {
  roleHint: string
  overallScore?: number
  requiredCoverage?: { matched: number; total: number; percent: number }
  preferredCoverage?: { matched: number; total: number; percent: number }
  strong: Array<{ technology: string; evidence: string; sourceIds: string[] }>
  partial: Array<{ technology: string; evidence: string; sourceIds: string[] }>
  missing: string[]
  transferable?: Array<{ skill: string; evidence: string; sourceIds: string[] }>
  relevantProjects: Array<{ id: string; title: string; reason: string }>
  interviewQuestions: string[]
  hiringRisks?: string[]
  whyInterview?: string
  requirementMatrix?: Array<{
    requirement: string
    kind: 'required' | 'preferred'
    status: 'strong' | 'partial' | 'missing'
    evidence?: string
    sourceIds: string[]
  }>
}

export type InterviewTrack = {
  id: string
  label: string
  blurb: string
}

export type InterviewResponse = {
  conversationId: string
  track: string
  question: string
  phase: 'ask' | 'followup' | 'wrap'
  sourceId?: string
  followUps: string[]
}

export type AnalyticsSummary = {
  windowDays: number
  totals: {
    visitors: number
    chatStarted: number
    questions: number
    resumeViewed: number
    resumeDownloaded: number
    projectViewed: number
    githubClicked: number
    contactClicked: number
    fitAnalyzed: number
    interviewStarted: number
  }
  mostAsked: Array<{ query: string; count: number }>
}

export type ApiErrorCode = 'rate_limit' | 'network' | 'unavailable' | 'ai' | 'empty' | 'unknown'

const AI_ERROR = 'Something went wrong while processing that question.'
const NETWORK_ERROR = 'Unable to connect to the assistant.'
const RATE_LIMIT_ERROR = "You've reached the current request limit. Please try again shortly."
const UNAVAILABLE_ERROR = 'The assistant is temporarily unavailable. Please try again shortly.'
const TIMEOUT_ERROR = 'The assistant is taking too long to respond. Please try again.'

export class ApiError extends Error {
  code: ApiErrorCode
  status?: number

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REQUEST_TIMEOUT_MS = 60_000

export function getErrorMessage(error: unknown): { code: ApiErrorCode; message: string } {
  if (error instanceof ApiError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof TypeError) {
    return { code: 'network', message: NETWORK_ERROR }
  }
  return {
    code: 'ai',
    message: AI_ERROR,
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export async function sendChat(input: {
  message: string
  conversationId?: string
  mode: ChatMode
}): Promise<ChatApiResponse> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as
      | ChatApiResponse
      | { error?: { code?: string; message?: string } }
      | null

    if (!response.ok) {
      throw mapHttpError(response.status, payload && 'error' in payload ? payload.error : undefined)
    }

    if (!payload || !('message' in payload) || typeof payload.message !== 'string') {
      throw new ApiError('ai', AI_ERROR, response.status)
    }

    const chat = payload as ChatApiResponse
    return {
      ...chat,
      message: flattenSpokenReply(chat.message),
      sections: chat.isResume ? chat.sections ?? [] : [],
      sources: chat.sources ?? [],
      followUps: chat.followUps ?? [],
      retrievalStages: chat.retrievalStages ?? [],
      verified: chat.verified !== false,
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('unavailable', TIMEOUT_ERROR)
    }
    throw new ApiError('network', NETWORK_ERROR)
  } finally {
    window.clearTimeout(timer)
  }
}

export async function fetchBrief(): Promise<RecruiterBrief> {
  const response = await fetch(`${API_BASE}/api/candidate/brief`)
  if (!response.ok) throw new ApiError('network', NETWORK_ERROR, response.status)
  const payload = await parseJson<{ brief: RecruiterBrief }>(response)
  return payload.brief
}

export async function fetchTimeline(): Promise<TimelineNode[]> {
  const response = await fetch(`${API_BASE}/api/candidate/timeline`)
  if (!response.ok) throw new ApiError('network', NETWORK_ERROR, response.status)
  const payload = await parseJson<{ timeline: TimelineNode[] }>(response)
  return payload.timeline
}

export async function fetchProject(id: string): Promise<ProjectDeepDive> {
  const response = await fetch(`${API_BASE}/api/candidate/projects/${id}`)
  if (!response.ok) throw new ApiError('network', NETWORK_ERROR, response.status)
  const payload = await parseJson<{ project: ProjectDeepDive }>(response)
  return payload.project
}

export async function fetchSource(id: string): Promise<Source> {
  const response = await fetch(`${API_BASE}/api/candidate/sources/${encodeURIComponent(id)}`)
  if (!response.ok) throw new ApiError('network', NETWORK_ERROR, response.status)
  const payload = await parseJson<{ source: Source }>(response)
  return payload.source
}

export async function analyzeJob(jobDescription: string, conversationId?: string): Promise<FitAnalysis> {
  const response = await fetch(`${API_BASE}/api/fit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription, conversationId }),
  })
  if (!response.ok) throw mapHttpError(response.status)
  const payload = await parseJson<{ analysis: FitAnalysis }>(response)
  return payload.analysis
}

export async function fetchInterviewTracks(): Promise<InterviewTrack[]> {
  const response = await fetch(`${API_BASE}/api/interview/tracks`)
  if (!response.ok) throw new ApiError('network', NETWORK_ERROR, response.status)
  const payload = await parseJson<{ tracks: InterviewTrack[] }>(response)
  return payload.tracks
}

export async function sendInterview(input: {
  track: string
  message?: string
  conversationId?: string
}): Promise<InterviewResponse> {
  const response = await fetch(`${API_BASE}/api/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw mapHttpError(response.status)
  return parseJson<InterviewResponse>(response)
}

export async function trackEvent(
  type: string,
  extra?: { query?: string; conversationId?: string },
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...extra }),
    })
  } catch {
    // Analytics must never block the recruiter UI.
  }
}

export async function fetchAnalytics(key: string): Promise<AnalyticsSummary> {
  const response = await fetch(`${API_BASE}/api/analytics`, {
    headers: { 'x-analytics-key': key },
  })
  if (response.status === 401) throw new ApiError('unknown', 'Invalid analytics key.', 401)
  if (!response.ok) throw new ApiError('network', NETWORK_ERROR, response.status)
  return parseJson<AnalyticsSummary>(response)
}

export async function createConversation(): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/api/conversations`, { method: 'POST' })
  if (!response.ok) {
    throw new ApiError('network', NETWORK_ERROR, response.status)
  }
  return response.json() as Promise<{ id: string }>
}

function flattenSpokenReply(raw: string): string {
  const trimmed = stripCodeFences(raw).trim()
  if (!trimmed) return trimmed
  if (!trimmed.includes('{')) return trimmed

  const parsed = parseLooseObject(trimmed)
  if (parsed) {
    const spoken = pickSpokenField(parsed) || joinSectionBodies(parsed)
    if (spoken) return spoken
  }

  const extracted =
    extractQuotedField(trimmed, 'intro') ||
    extractQuotedField(trimmed, 'message') ||
    extractQuotedBodies(trimmed)
  if (extracted) return extracted

  if (/^\s*\{[\s\S]*"sections"[\s\S]*\}\s*$/.test(trimmed)) {
    return extractQuotedBodies(trimmed) || 'I can tell you more if you ask a specific question.'
  }

  return trimmed
}

function stripCodeFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
}

function parseLooseObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const value = JSON.parse(raw.slice(start, end + 1)) as unknown
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

function pickSpokenField(parsed: Record<string, unknown>): string {
  for (const key of ['intro', 'Intro', 'message', 'Message', 'text', 'answer']) {
    const value = parsed[key]
    if (typeof value === 'string' && value.trim() && !value.trim().startsWith('{')) {
      return value.trim()
    }
  }
  return ''
}

function joinSectionBodies(parsed: Record<string, unknown>): string {
  if (!Array.isArray(parsed.sections) && !Array.isArray(parsed.Sections)) return ''
  const sections = (parsed.sections ?? parsed.Sections) as unknown[]
  return sections
    .map((section) => {
      if (!section || typeof section !== 'object') return ''
      const item = section as Record<string, unknown>
      const body = item.body ?? item.Body
      return typeof body === 'string' ? body.trim() : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function extractQuotedField(raw: string, field: string): string {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i'))
  if (!match) return ''
  try {
    return JSON.parse(`"${match[1]}"`) as string
  } catch {
    return match[1]
  }
}

function extractQuotedBodies(raw: string): string {
  const bodies: string[] = []
  const pattern = /"body"\s*:\s*"((?:\\.|[^"\\])*)"/gi
  let match = pattern.exec(raw)
  while (match) {
    try {
      bodies.push(JSON.parse(`"${match[1]}"`) as string)
    } catch {
      bodies.push(match[1])
    }
    match = pattern.exec(raw)
  }
  return bodies.join('\n\n')
}

function mapHttpError(status: number, error?: { code?: string; message?: string }): ApiError {
  if (status === 429 || error?.code === 'rate_limited') {
    return new ApiError('rate_limit', RATE_LIMIT_ERROR, status)
  }
  if (status === 502 || status === 504) {
    return new ApiError('network', NETWORK_ERROR, status)
  }
  if (status === 503 || error?.code === 'gemini_unavailable') {
    return new ApiError('unavailable', UNAVAILABLE_ERROR, status)
  }
  if (status === 400) {
    return new ApiError('ai', error?.message ?? AI_ERROR, status)
  }
  return new ApiError('ai', AI_ERROR, status)
}
