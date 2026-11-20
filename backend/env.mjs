import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

const localFile = fileURLToPath(new URL('../.env.local', import.meta.url))
const dotEnvFile = fileURLToPath(new URL('../.env', import.meta.url))

if (existsSync(localFile)) {
  loadEnvFile(localFile)
} else if (existsSync(dotEnvFile)) {
  loadEnvFile(dotEnvFile)
}

export function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}. Run neon deploy or configure the server environment.`)
  return value
}
