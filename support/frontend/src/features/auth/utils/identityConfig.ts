export function getIdentityOrigin(): string {
  return import.meta.env.VITE_IDENTITY_ORIGIN ?? 'http://127.0.0.1:3011'
}

export function getIdentityLoginUrl(): string {
  return `${getIdentityOrigin()}/login`
}

export function getIdentityApiBase(): string {
  return import.meta.env.VITE_IDENTITY_API_BASE_URL ?? 'http://127.0.0.1:4011/api/v1'
}

export function getAuthCallbackUrl(): string {
  return `${window.location.origin}/callback`
}

export function getIdentityProfileUrl(): string {
  return `${getIdentityOrigin()}/profile`
}
