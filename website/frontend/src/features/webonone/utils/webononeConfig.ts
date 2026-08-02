const DEFAULT_WEBONONE_ORIGIN = 'http://127.0.0.1:3010'

export function getWebOnOneOrigin(): string {
  const fromEnv = import.meta.env.VITE_WEBONONE_ORIGIN?.trim()
  return (fromEnv || DEFAULT_WEBONONE_ORIGIN).replace(/\/$/, '')
}

/**
 * WebOnOne app login with return to the website.
 * @param returnPath Absolute path or full URL on the website origin (defaults to `/`).
 */
export function getWebOnOneLoginUrl(returnPath?: string): string {
  const path = returnPath?.trim()
  const returnUrl =
    path && path.startsWith('http')
      ? path
      : `${window.location.origin}${path && path.startsWith('/') ? path : '/'}`
  const url = new URL(`${getWebOnOneOrigin()}/login`)
  url.searchParams.set('return_url', returnUrl)
  return url.toString()
}

/** Authenticated WebOnOne app home. */
export function getWebOnOneAppUrl(): string {
  return `${getWebOnOneOrigin()}/`
}
