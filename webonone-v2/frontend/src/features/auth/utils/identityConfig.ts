const DEFAULT_IDENTITY_ORIGIN = 'http://127.0.0.1:3011'
const DEFAULT_IDENTITY_API_BASE = 'http://127.0.0.1:4011/api/v1'

export const IDENTITY_GUEST_AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-reset-otp',
  '/reset-password',
] as const

export type IdentityGuestAuthPath = (typeof IDENTITY_GUEST_AUTH_PATHS)[number]

export function isIdentityGuestAuthPath(pathname: string): pathname is IdentityGuestAuthPath {
  return (IDENTITY_GUEST_AUTH_PATHS as readonly string[]).includes(pathname)
}

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

/** Iframe auth src for WebOnOne guest routes — parentOrigin + returnPath; forward prompt=login and path query. */
export function buildIdentityEmbedAuthUrl(
  identityPath: IdentityGuestAuthPath,
  returnPath = '/',
  parentSearch = '',
): string {
  const url = new URL(`${getIdentityOrigin()}${identityPath}`)
  url.searchParams.set('parentOrigin', window.location.origin)
  url.searchParams.set('returnPath', returnPath)

  const normalizedSearch = parentSearch.startsWith('?') ? parentSearch.slice(1) : parentSearch
  if (normalizedSearch) {
    const params = new URLSearchParams(normalizedSearch)
    params.forEach((value, key) => {
      if (key !== 'return_path' && key !== 'returnPath' && key !== 'parentOrigin' && key !== 'prompt') {
        url.searchParams.set(key, value)
      }
    })
  }

  const prompt = new URLSearchParams(window.location.search).get('prompt')
  if (prompt === 'login') {
    url.searchParams.set('prompt', 'login')
  }

  return url.toString()
}

/** Iframe login src for WebOnOne `/login` — parentOrigin + returnPath; forward prompt=login. */
export function buildIdentityEmbedLoginUrl(returnPath = '/'): string {
  return buildIdentityEmbedAuthUrl('/login', returnPath)
}

/**
 * WebOnOne is the shell host — never an embedded peer.
 * PlatformAlertConfirmDialog always uses a local AlertDialog here.
 */
export function isAllowedParentOrigin(_origin: string): boolean {
  return false
}
