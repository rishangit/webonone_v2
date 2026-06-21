import { QUERY } from './constants'
import { matchesAllowedOrigin } from './redirectAllowlist'

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

  return parsed.toString()
}

export function stripAuthCodeFromSearch(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams)
  params.delete(QUERY.CODE)
  return params.toString()
}
