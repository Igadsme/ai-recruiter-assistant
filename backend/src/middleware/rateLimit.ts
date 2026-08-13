import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.ts'

export const chatRateLimiter: RequestHandler = rateLimit({
  windowMs: config.chatRateLimitWindowMs,
  max: config.chatRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rate_limited',
      message: "You've reached the current request limit. Please try again shortly.",
    },
  },
})
