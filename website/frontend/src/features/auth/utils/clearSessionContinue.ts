import { matchesAllowedOrigin, parseAllowlistPatterns } from '@webonone/platform-nav'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { getWebOnOneOrigin } from '@/features/webonone/utils/webononeConfig'

/** Origins allowed for clear-session `continue` redirects. */
export function getWebsiteContinueAllowlist(): string[] {
  const fromEnv = import.meta.env.VITE_CLEAR_SESSION_ALLOWED_ORIGINS?.trim()
  if (fromEnv) {
    return parseAllowlistPatterns(fromEnv)
  }
  // Identity `/logout` is a continue hop after peer clear (clear-first logout).
  return [window.location.origin, getWebOnOneOrigin(), getIdentityOrigin()]
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

  if (!matchesAllowedOrigin(parsed.origin, getWebsiteContinueAllowlist())) {
    return null
  }

  return parsed.toString()
}
