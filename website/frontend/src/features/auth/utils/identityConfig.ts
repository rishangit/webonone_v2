const DEFAULT_IDENTITY_ORIGIN = 'http://127.0.0.1:3011'
const DEFAULT_IDENTITY_API_BASE = 'http://127.0.0.1:4011/api/v1'

export function getIdentityOrigin(): string {
  const fromEnv = import.meta.env.VITE_IDENTITY_ORIGIN?.trim()
  return (fromEnv || DEFAULT_IDENTITY_ORIGIN).replace(/\/$/, '')
}

export function getIdentityApiBase(): string {
  const fromEnv = import.meta.env.VITE_IDENTITY_API_BASE_URL?.trim()
  return (fromEnv || DEFAULT_IDENTITY_API_BASE).replace(/\/$/, '')
}
