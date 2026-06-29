const DEFAULT_EMAIL_ORIGIN = 'http://localhost:3004'
const DEFAULT_EMAIL_API_BASE = 'http://localhost:4004/api/v1'

export function getEmailOrigin(): string {
  return import.meta.env.VITE_EMAIL_ORIGIN ?? DEFAULT_EMAIL_ORIGIN
}

export function getEmailApiBase(): string {
  return import.meta.env.VITE_EMAIL_API_BASE_URL ?? DEFAULT_EMAIL_API_BASE
}

export function getEmailAppUrl(path = '/history'): string {
  const base = getEmailOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function getEmailCallbackUrl(): string {
  return `${getEmailOrigin()}/callback`
}
