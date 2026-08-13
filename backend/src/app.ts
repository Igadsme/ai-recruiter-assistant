import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.ts'
import { apiRouter } from './routes/api.ts'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.ts'
import { requestLogger } from './middleware/requestLogger.ts'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  if (config.isProduction) {
    app.set('trust proxy', 1)
  }
  app.use(requestLogger)
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
              frameSrc: ["'self'"],
              objectSrc: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  )
  app.use(
    cors({
      origin: config.isProduction
        ? [config.frontendUrl, /\.onrender\.com$/, /\.vercel\.app$/]
        : [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '8kb' }))

  app.use('/api', apiRouter)

  if (config.isProduction) {
    const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist')
    app.use(express.static(frontendDist))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(frontendDist, 'index.html'))
    })
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
