import { parseReturnUrl, stripAuthCodeFromSearch } from '@webonone/platform-nav'

const ALLOWED_REDIRECT_URIS = (
  import.meta.env.VITE_ALLOWED_REDIRECT_URIS ?? 'http://localhost:3000/callback'
)
  .split(',')
  .map((uri: string) => uri.trim())
  .filter(Boolean)

function getIdentityOrigin(): string | null {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const profileUrl = import.meta.env.VITE_IDENTITY_PROFILE_URL ?? 'http://localhost:3001/profile'
  try {
    return new URL(profileUrl).origin
  } catch {
    return null
  }
}

export function getConsumerReturnOrigins(): string[] {
  const identityOrigin = getIdentityOrigin()
  const origins = new Set<string>()

  for (const uri of ALLOWED_REDIRECT_URIS) {
    try {
      const origin = new URL(uri).origin
      if (origin !== identityOrigin) {
        origins.add(origin)
      }
    } catch {
      // skip invalid URIs
    }
  }

  return [...origins]
}

export function parseProfileReturnUrl(searchParams: URLSearchParams): string | null {
  return parseReturnUrl(searchParams, getConsumerReturnOrigins())
}

export function buildProfileSearchWithoutCode(searchParams: URLSearchParams): string {
  return stripAuthCodeFromSearch(searchParams)
}
