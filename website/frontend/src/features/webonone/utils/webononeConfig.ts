const DEFAULT_WEBONONE_ORIGIN = 'http://127.0.0.1:3010'

export function getWebOnOneOrigin(): string {
  const fromEnv = import.meta.env.VITE_WEBONONE_ORIGIN?.trim()
  return (fromEnv || DEFAULT_WEBONONE_ORIGIN).replace(/\/$/, '')
}

/** WebOnOne app login — full-page handoff (Identity embed lives on WebOnOne). */
export function getWebOnOneLoginUrl(): string {
  return `${getWebOnOneOrigin()}/login`
}

/** Authenticated WebOnOne app home. */
export function getWebOnOneAppUrl(): string {
  return `${getWebOnOneOrigin()}/`
}
