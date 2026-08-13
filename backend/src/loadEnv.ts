import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectEnv = path.resolve(here, '../../.env')

// Local .env should win over a stale GEMINI_MODEL exported in the shell.
dotenv.config({ path: projectEnv, override: true })
dotenv.config()
