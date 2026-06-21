import { matchesRedirectUri, parseAllowlistPatterns } from '@webonone/platform-nav'

const ALLOWED_REDIRECT_PATTERNS = parseAllowlistPatterns(
  import.meta.env.VITE_ALLOWED_REDIRECT_URIS ?? 'http://localhost:*',
)

export function isAllowedRedirectUri(redirectUri: string): boolean {
  return matchesRedirectUri(redirectUri, ALLOWED_REDIRECT_PATTERNS)
}

export function getAllowedRedirectPatterns(): string[] {
  return ALLOWED_REDIRECT_PATTERNS
}