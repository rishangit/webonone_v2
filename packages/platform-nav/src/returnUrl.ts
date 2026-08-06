import { QUERY } from './constants'
import { matchesAllowedOrigin } from './redirectAllowlist'

/** Same-app paths that must not be used as post-login return targets (redirect loops). */
const AUTH_LOOP_PATHS = new Set(['/login', '/callback', '/auth/clear-session'])

export function parseReturnUrl(
  searchParams: URLSearchParams,
  allowedOriginPatterns: string[],
): string | null {
  const raw = searchParams.get(QUERY.RETURN_URL)
  if (!raw) return null

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  if (!matchesAllowedOrigin(parsed.origin, allowedOriginPatterns)) {
    return null
  }

  // Keep pathname + search; drop hash (unused for auth-code matching).
  parsed.hash = ''
  return `${parsed.origin}${parsed.pathname}${parsed.search}`
}

/**
 * Validate a same-origin app return path (e.g. `return_path` on WebOnOne `/login`).
 * Rejects absolute URLs, protocol-relative URLs, and auth loop routes.
 */
export function parseCoreReturnPath(raw: string | null | undefined): string | null {
  if (!raw) {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed, 'https://app.local')
  } catch {
    return null
  }

  if (AUTH_LOOP_PATHS.has(parsed.pathname) || parsed.pathname.startsWith('/login/')) {
    return null
  }

  return `${parsed.pathname}${parsed.search}`
}

export function stripAuthCodeFromSearch(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams)
  params.delete(QUERY.CODE)
  return params.toString()
}

/** Full-page satellite handoff: auth code + validated return_url (not iframe embed). */
export function hasPlatformRedirectHandoff(
  searchParams: URLSearchParams,
  allowedOriginPatterns: string[],
): boolean {
  const code = searchParams.get(QUERY.CODE)
  if (!code || searchParams.get(QUERY.STATE)) {
    return false
  }
  return Boolean(parseReturnUrl(searchParams, allowedOriginPatterns))
}
