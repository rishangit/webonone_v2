const DEFAULT_SMS_ORIGIN = 'http://localhost:3016'

export function getSmsOrigin(): string {
  return import.meta.env.VITE_SMS_ORIGIN ?? DEFAULT_SMS_ORIGIN
}

export function getSmsAppUrl(path = '/send'): string {
  const base = getSmsOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
