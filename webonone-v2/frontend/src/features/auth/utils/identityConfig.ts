const DEFAULT_IDENTITY_ORIGIN = 'http://localhost:3001'
const DEFAULT_IDENTITY_API_BASE = 'http://localhost:4001/api/v1'

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
    return 'http://localhost:3000/callback'
  }

  return `${window.location.origin}/callback`
}
