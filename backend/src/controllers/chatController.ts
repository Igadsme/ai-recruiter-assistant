import type { RequestHandler } from 'express'
import { handleChat } from '../services/chat.ts'
import { chatRequestSchema } from '../utils/validation.ts'
import { recordMetric } from '../services/metrics.ts'

export const postChat: RequestHandler = async (req, res, next) => {
  const started = Date.now()
  try {
    const body = chatRequestSchema.parse(req.body)
    const result = await handleChat({
      message: body.message,
      conversationId: body.conversationId,
      mode: body.mode,
    })
    recordMetric('request_latency', Date.now() - started)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
