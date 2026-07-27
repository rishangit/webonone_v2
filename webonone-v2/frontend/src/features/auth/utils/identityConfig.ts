const DEFAULT_IDENTITY_ORIGIN = 'http://127.0.0.1:3011'
const DEFAULT_IDENTITY_API_BASE = 'http://127.0.0.1:4011/api/v1'

export function getIdentityOrigin(): string {
  return import.meta.env.VITE_IDENTITY_ORIGIN ?? DEFAULT_IDENTITY_ORIGIN
}

export function getIdentityLoginUrl(): string {
  return `${getIdentityOrigin()}/login`
}

export function getIdentityApiBase(): string {
  return import.meta.env.VITE_IDENTITY_API_BASE_URL ?? DEFAULT_IDENTITY_API_BASE
}

export function getIdentityProfileUrl(): string {
  return `${getIdentityOrigin()}/profile`
}

export function getAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:3010/callback'
  }

  return `${window.location.origin}/callback`
}

/** Iframe login src for WebOnOne `/login` — parentOrigin + returnPath only. */
export function buildIdentityEmbedLoginUrl(returnPath = '/'): string {
  const url = new URL(getIdentityLoginUrl())
  url.searchParams.set('parentOrigin', window.location.origin)
  url.searchParams.set('returnPath', returnPath)
  return url.toString()
}
