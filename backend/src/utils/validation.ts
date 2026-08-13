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
