import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_DEV_URL = 'http://127.0.0.1:3010'
const DEFAULT_PROD_URL = 'https://app.webonone.com'

export function loadDotEnv(): void {
  const envPath = path.join(app.getAppPath(), '..', '.env')
  const unpackagedEnv = path.join(__dirname, '..', '.env')
  const candidate = fs.existsSync(unpackagedEnv) ? unpackagedEnv : envPath
  if (!fs.existsSync(candidate)) {
    return
  }

  const text = fs.readFileSync(candidate, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }
    const eq = line.indexOf('=')
    if (eq <= 0) {
      continue
    }
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export function getAppUrl(): string {
  const fromEnv = process.env.WEBONONE_APP_URL?.trim()
  if (fromEnv) {
    return fromEnv
  }
  return app.isPackaged ? DEFAULT_PROD_URL : DEFAULT_DEV_URL
}

export function getAppOrigin(appUrl: string): string {
  return new URL(appUrl).origin
}
