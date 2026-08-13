import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const node = process.execPath
const backendDir = path.join(root, 'backend')
const frontendDir = path.join(root, 'frontend')

console.log('[start]', node, process.version)
console.log('[api] launching (no compile step)')

const api = spawn(node, [
  '--experimental-strip-types',
  '--experimental-transform-types',
  '--no-warnings',
  'src/index.ts',
], {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
})

const ui = spawn(node, [
  path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js'),
  '--host', '127.0.0.1',
  '--port', '5173',
  '--strictPort',
], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: process.env,
})

function stop() {
  api.kill('SIGTERM')
  ui.kill('SIGTERM')
}

api.on('exit', (code) => {
  console.error('[api] exited', code)
  if (code) {
    stop()
    process.exit(code)
  }
})
ui.on('exit', (code) => {
  console.error('[ui] exited', code)
  if (code) {
    stop()
    process.exit(code)
  }
})
process.on('SIGINT', () => {
  stop()
  process.exit(0)
})
