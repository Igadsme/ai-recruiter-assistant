import type { RequestHandler } from 'express'
import { handleChat } from '../services/chat.ts'
import { chatRequestSchema } from '../utils/validation.ts'

export const postChat: RequestHandler = async (req, res, next) => {
  try {
    const body = chatRequestSchema.parse(req.body)
    const result = await handleChat({
      message: body.message,
      conversationId: body.conversationId,
      mode: body.mode,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}
