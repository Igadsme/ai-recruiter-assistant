import pino from 'pino'
import { config } from './config.ts'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (config.isProduction ? 'info' : 'debug'),
  redact: {
    paths: ['req.headers.authorization', 'GEMINI_API_KEY', '*.apiKey'],
    remove: true,
  },
})
