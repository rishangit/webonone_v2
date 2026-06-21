import { parseReturnUrl, stripAuthCodeFromSearch } from '@webonone/platform-nav'
import { getAllowedRedirectPatterns } from '@/features/auth/utils/redirectAllowlist'

function getIdentityOrigin(): string | null {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3001'
}

export function parseProfileReturnUrl(searchParams: URLSearchParams): string | null {
  const identityOrigin = getIdentityOrigin()
  const patterns = getAllowedRedirectPatterns()

  const returnUrl = parseReturnUrl(searchParams, patterns)
  if (!returnUrl) {
    return null
  }

  try {
    const origin = new URL(returnUrl).origin
    if (identityOrigin && origin === identityOrigin) {
      return null
    }
  } catch {
    return null
  }

  return returnUrl
}

export function buildProfileSearchWithoutCode(searchParams: URLSearchParams): string {
  return stripAuthCodeFromSearch(searchParams)
}
