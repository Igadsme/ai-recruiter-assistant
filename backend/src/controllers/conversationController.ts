import type { RequestHandler } from 'express'
import { createConversation, getConversation } from '../services/conversation.ts'
import { conversationIdParamSchema } from '../utils/validation.ts'

export const postConversation: RequestHandler = (_req, res) => {
  const conversation = createConversation()
  res.status(201).json({
    id: conversation.id,
    messages: conversation.messages,
  })
}

export const getConversationById: RequestHandler = (req, res, next) => {
  try {
    const { id } = conversationIdParamSchema.parse(req.params)
    const conversation = getConversation(id)
    res.json({
      id: conversation.id,
      messages: conversation.messages,
    })
  } catch (error) {
    next(error)
  }
}
