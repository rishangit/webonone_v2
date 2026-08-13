const DEFAULT_IDENTITY_ORIGIN = 'http://127.0.0.1:3011'
const DEFAULT_IDENTITY_API_BASE = 'http://127.0.0.1:4011/api/v1'

export function getIdentityOrigin(): string {
  const fromEnv = import.meta.env.VITE_IDENTITY_ORIGIN?.trim()
  return (fromEnv || DEFAULT_IDENTITY_ORIGIN).replace(/\/$/, '')
}

export function getIdentityApiBase(): string {
  const fromEnv = import.meta.env.VITE_IDENTITY_API_BASE_URL?.trim()
  return (fromEnv || DEFAULT_IDENTITY_API_BASE).replace(/\/$/, '')
}

export function getIdentityLoginUrl(): string {
  return `${getIdentityOrigin()}/login`
}

/** Identity login iframe src — stay on the website; Identity posts JWT back. */
export function buildIdentityEmbedLoginUrl(returnPath = '/'): string {
  const url = new URL(getIdentityLoginUrl())
  url.searchParams.set('parentOrigin', window.location.origin)
  url.searchParams.set('returnPath', returnPath)
  if (typeof window !== 'undefined') {
    const prompt = new URLSearchParams(window.location.search).get('prompt')
    if (prompt === 'login') {
      url.searchParams.set('prompt', 'login')
    }
  }
  return url.toString()
}

/** In-app website login path (Identity iframe), never the WebOnOne app. */
export function getWebsiteLoginHref(returnPath?: string): string {
  const path = returnPath?.trim()
  if (!path || path === '/' || path.startsWith('/login')) {
    return '/login'
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `/login?returnPath=${encodeURIComponent(normalized)}`
}
