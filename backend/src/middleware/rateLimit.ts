import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.ts'

function limiter(max: number): RequestHandler {
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return (_req, _res, next) => next()
  }
  return rateLimit({
    windowMs: config.chatRateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'rate_limited',
        message: "You've reached the current request limit. Please try again shortly.",
      },
    },
  })
}

export const chatRateLimiter = limiter(config.chatRateLimitMax)
export const fitRateLimiter = limiter(Math.max(8, Math.floor(config.chatRateLimitMax * 0.7)))
export const analyticsRateLimiter = limiter(40)
export const generalRateLimiter = limiter(30)
