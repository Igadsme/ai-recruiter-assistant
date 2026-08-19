import { z } from 'zod'

export const MAX_MESSAGE_LENGTH = 2000

export const chatRequestSchema = z.object({
  message: z
    .string({ required_error: 'message is required' })
    .trim()
    .min(1, 'message cannot be empty')
    .max(MAX_MESSAGE_LENGTH, `message must be ${MAX_MESSAGE_LENGTH} characters or fewer`),
  conversationId: z
    .string()
    .trim()
    .uuid('conversationId must be a valid UUID')
    .optional(),
  mode: z.enum(['general', 'recruiter']).optional().default('general'),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

export const conversationIdParamSchema = z.object({
  id: z.string().uuid('conversation id must be a valid UUID'),
})

export const fitRequestSchema = z.object({
  jobDescription: z
    .string({ required_error: 'jobDescription is required' })
    .trim()
    .min(20, 'Paste a fuller job description (at least 20 characters).')
    .max(12_000, 'Job description must be 12,000 characters or fewer'),
  conversationId: z.string().uuid().optional(),
})

export const interviewRequestSchema = z.object({
  track: z.enum(['behavioral', 'java', 'python', 'backend', 'ai', 'system-design']),
  message: z.string().trim().max(MAX_MESSAGE_LENGTH).optional(),
  conversationId: z.string().uuid().optional(),
})

export const analyticsEventSchema = z.object({
  type: z.enum([
    'portfolio_visit',
    'chat_started',
    'question_asked',
    'project_viewed',
    'resume_viewed',
    'resume_downloaded',
    'github_clicked',
    'contact_clicked',
    'fit_analyzed',
    'interview_started',
  ]),
  query: z.string().trim().max(500).optional(),
  conversationId: z.string().uuid().optional(),
})

export const sourceIdParamSchema = z.object({
  id: z.string().min(1),
})

export const projectIdParamSchema = z.object({
  id: z.string().min(1),
})
