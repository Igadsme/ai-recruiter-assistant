import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../types.ts'
import { logger } from '../logger.ts'

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: error.issues[0]?.message ?? 'Invalid request.',
      },
    })
    return
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    })
    return
  }

  logger.error(
    {
      err: error instanceof Error ? { name: error.name, message: error.message } : 'unknown',
      method: req.method,
      path: req.path,
    },
    'unhandled error',
  )

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Something went wrong while processing that question.',
    },
  })
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: 'Not found.',
    },
  })
}
