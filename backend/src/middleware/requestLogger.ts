import type { Request, Response, NextFunction } from 'express'
import { logger } from '../logger.ts'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now()
  res.on('finish', () => {
    logger.info({
      type: 'http',
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      latencyMs: Date.now() - started,
    })
  })
  next()
}
