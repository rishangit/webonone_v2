const DEFAULT_EMAIL_ORIGIN = 'http://localhost:3004'

export function getEmailOrigin(): string {
  return import.meta.env.VITE_EMAIL_ORIGIN ?? DEFAULT_EMAIL_ORIGIN
}

export function getEmailAppUrl(): string {
  return `${getEmailOrigin()}/`
}

export function getEmailHomeRedirectUri(): string {
  return getEmailAppUrl()
}

export function getEmailCallbackUrl(): string {
  return `${getEmailOrigin()}/callback`
}
