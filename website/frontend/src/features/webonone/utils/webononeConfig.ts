const DEFAULT_WEBONONE_ORIGIN = 'http://127.0.0.1:3010'

export function getWebOnOneOrigin(): string {
  const fromEnv = import.meta.env.VITE_WEBONONE_ORIGIN?.trim()
  return (fromEnv || DEFAULT_WEBONONE_ORIGIN).replace(/\/$/, '')
}

/** WebOnOne app login with return to the current website origin. */
export function getWebOnOneLoginUrl(): string {
  const returnUrl = `${window.location.origin}/`
  const url = new URL(`${getWebOnOneOrigin()}/login`)
  url.searchParams.set('return_url', returnUrl)
  return url.toString()
}

/** Authenticated WebOnOne app home. */
export function getWebOnOneAppUrl(): string {
  return `${getWebOnOneOrigin()}/`
}
