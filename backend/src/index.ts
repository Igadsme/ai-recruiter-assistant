import './loadEnv.ts'
import { config } from './config.ts'
import { logger } from './logger.ts'
import { createApp } from './app.ts'

console.log('[api] starting Express on ' + config.host + ':' + config.port)
console.log('[api] gemini model', config.geminiModel)

const app = createApp()

const server = app.listen(config.port, config.host, () => {
  console.log('[api] listening on http://' + config.host + ':' + config.port)
  logger.info({ port: config.port, host: config.host, env: config.nodeEnv }, 'api server started')
  void import('@google/genai')
    .then(() => console.log('[api] gemini sdk ready'))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'unknown'
      console.error('[api] gemini sdk failed', message)
    })
})

server.on('error', (error: NodeJS.ErrnoException) => {
  logger.error({ err: { code: error.code, message: error.message } }, 'api server failed to start')
  process.exit(1)
})
