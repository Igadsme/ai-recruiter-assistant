import type { RequestHandler } from 'express'
import { createConversation, getConversation, patchSession } from '../services/conversation.ts'
import { conversationIdParamSchema } from '../utils/validation.ts'

export const postConversation: RequestHandler = (_req, res) => {
  const conversation = createConversation()
  res.status(201).json({
    id: conversation.id,
    messages: conversation.messages,
    session: conversation.session,
  })
}

export const getConversationById: RequestHandler = (req, res, next) => {
  try {
    const { id } = conversationIdParamSchema.parse(req.params)
    const conversation = getConversation(id)
    res.json({
      id: conversation.id,
      messages: conversation.messages,
      session: conversation.session,
    })
  } catch (error) {
    next(error)
  }
}

export const patchConversationSession: RequestHandler = (req, res, next) => {
  try {
    const { id } = conversationIdParamSchema.parse(req.params)
    const session = patchSession(id, req.body ?? {})
    res.json({ id, session })
  } catch (error) {
    next(error)
  }
}
