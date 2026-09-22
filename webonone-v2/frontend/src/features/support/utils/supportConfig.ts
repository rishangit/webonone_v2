const DEFAULT_SUPPORT_ORIGIN = 'http://127.0.0.1:3021'

export function getSupportOrigin(): string {
  const fromEnv = import.meta.env.VITE_SUPPORT_ORIGIN?.trim()
  return (fromEnv || DEFAULT_SUPPORT_ORIGIN).replace(/\/$/, '')
}

export function getSupportHomeUrl(): string {
  return `${getSupportOrigin()}/`
}

export function getSupportAppUrl(path = '/'): string {
  const origin = getSupportOrigin()
  if (path === '/' || path === '') {
    return `${origin}/`
  }
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function getSupportFeedbackUrl(): string {
  return getSupportAppUrl('/feedback')
}
