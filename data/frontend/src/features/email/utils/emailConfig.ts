const DEFAULT_EMAIL_ORIGIN = 'http://localhost:3014'

export function getEmailOrigin(): string {
  return import.meta.env.VITE_EMAIL_ORIGIN ?? DEFAULT_EMAIL_ORIGIN
}

export function getEmailAppUrl(path = '/history'): string {
  const base = getEmailOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
