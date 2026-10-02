import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = path.join(backendRoot, 'dist', 'db')

await mkdir(outputDirectory, { recursive: true })
await copyFile(path.join(backendRoot, 'src', 'db', 'schema.sql'), path.join(outputDirectory, 'schema.sql'))
