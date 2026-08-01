import { matchesAllowedOrigin, parseAllowlistPatterns } from '@webonone/platform-nav'
import { getWebsiteOrigin } from '@/features/auth/utils/websiteConfig'

/** Origins allowed for clear-session `continue` redirects. */
export function getWebOnOneContinueAllowlist(): string[] {
  const fromEnv = import.meta.env.VITE_CLEAR_SESSION_ALLOWED_ORIGINS?.trim()
  if (fromEnv) {
    return parseAllowlistPatterns(fromEnv)
  }
  return [window.location.origin, getWebsiteOrigin()]
}

export function parseClearSessionContinue(raw: string | null): string | null {
  if (!raw) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  if (!matchesAllowedOrigin(parsed.origin, getWebOnOneContinueAllowlist())) {
    return null
  }

  return parsed.toString()
}
