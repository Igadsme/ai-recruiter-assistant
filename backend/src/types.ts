export type ChatMode = 'general' | 'recruiter'

export type SourceType =
  | 'experience'
  | 'education'
  | 'project'
  | 'skill'
  | 'activity'
  | 'story'

export type Source = {
  type: SourceType
  title: string
  organization?: string
  date?: string
  technologies?: string[]
  metrics?: string[]
  relevantExcerpt?: string
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

export type Conversation = {
  id: string
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
}

export type GeminiStructuredResponse = {
  intro: string
  sections: MessageSection[]
  isResume?: boolean
}

export type ChatResponse = {
  message: string
  sections: MessageSection[]
  sources: Source[]
  conversationId: string
  isResume?: boolean
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
