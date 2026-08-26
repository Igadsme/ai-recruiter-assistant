export type ChatMode = 'general' | 'recruiter'

export type ConversationIntent =
  | 'greeting'
  | 'small_talk'
  | 'thanks'
  | 'assistant'
  | 'introduction'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'story'
  | 'why_hire'
  | 'fit_analysis'
  | 'interview'
  | 'proof'
  | 'resume'
  | 'contact'
  | 'vague'
  | 'unsupported'
  | 'sensitive'
  | 'candidate'

export type PipelinePath = 'casual' | 'candidate' | 'recruiter_tool'

export type SourceType =
  | 'experience'
  | 'education'
  | 'project'
  | 'skill'
  | 'activity'
  | 'story'

export type Source = {
  id: string
  type: SourceType
  category: string
  title: string
  organization?: string
  date?: string
  technologies?: string[]
  metrics?: string[]
  relevantExcerpt?: string
  verified: boolean
}

export type MessageSection = {
  label: string
  body: string
  tags: string[]
  metrics?: string[]
}

export type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
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

export type Conversation = {
  id: string
  messages: ConversationMessage[]
  session: RecruiterSession
  createdAt: number
  updatedAt: number
}

export type GeminiStructuredResponse = {
  intro: string
  sections: MessageSection[]
  isResume?: boolean
  claims?: Array<{ text: string; sourceIds: string[] }>
}

export type RetrievalStage = {
  id: string
  label: string
  status: 'pending' | 'done' | 'skipped'
}

export type StrengthLevel = 'High' | 'Strong' | 'Moderate' | 'Limited'

export type RecruiterSummary = {
  relevantExperience: StrengthLevel
  aiExperience: StrengthLevel
  backendExperience: StrengthLevel
  frontendExperience: StrengthLevel
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
  website?: string
}

export type ChatResponse = {
  message: string
  sections: MessageSection[]
  sources: Source[]
  conversationId: string
  isResume?: boolean
  verified: boolean
  verificationNote?: string
  followUps: string[]
  retrievalStages: RetrievalStage[]
  recruiterSummary?: RecruiterSummary
  projectDeepDive?: ProjectDeepDive
  differentiators?: DifferentiatorGroup[]
  showContactCta: boolean
  session: RecruiterSession
  intent: ConversationIntent
  conversational: boolean
  revealSources: boolean
  pipelinePath?: PipelinePath
  claims?: EvidenceClaim[]
  fitAnalysis?: FitAnalysis
  clarifying?: boolean
}

export type CandidateCategory =
  | 'profile'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'activities'
  | 'story'
  | 'ai'
  | 'cybersecurity'
  | 'resume'
  | 'backend'
  | 'frontend'
  | 'why_hire'
  | 'contact'

export type FitMatch = {
  technology: string
  evidence: string
  sourceIds: string[]
}

export type FitCoverage = {
  matched: number
  total: number
  percent: number
}

export type FitRequirement = {
  requirement: string
  kind: 'required' | 'preferred'
  status: 'strong' | 'partial' | 'missing'
  evidence?: string
  sourceIds: string[]
}

export type FitAnalysis = {
  roleHint: string
  overallScore: number
  requiredCoverage: FitCoverage
  preferredCoverage: FitCoverage
  strong: FitMatch[]
  partial: FitMatch[]
  missing: string[]
  missingDetails: Array<{ requirement: string; notes: string }>
  transferable: Array<{ skill: string; evidence: string; sourceIds: string[] }>
  relevantProjects: Array<{ id: string; title: string; reason: string }>
  interviewQuestions: string[]
  hiringRisks: string[]
  whyInterview: string
  requirementMatrix: FitRequirement[]
}

export type EvidenceClaim = {
  claim: string
  supported: boolean
  organization?: string
  title?: string
  technologies?: string[]
  sourceIds: string[]
}

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, message: string, code: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function emptySession(): RecruiterSession {
  return {
    interests: [],
    questionsAsked: 0,
    projectsViewed: [],
    experienceViewed: [],
    resumeViewed: false,
    resumeDownloaded: false,
    githubClicked: false,
    contactClicked: false,
    exploring: 'Overview',
  }
}
