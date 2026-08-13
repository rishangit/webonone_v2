import { matchesAllowedOrigin, parseAllowlistPatterns, parseReturnUrl } from '@webonone/platform-nav'
import { getWebOnOneOrigin } from '@/features/webonone/utils/webononeConfig'

/** Origins allowed for app SSO-bridge return_url (auth-code handoff targets). */
export function getAppReturnAllowlist(): string[] {
  const fromEnv = import.meta.env.VITE_WEBONONE_ALLOWED_ORIGINS?.trim()
  if (fromEnv) {
    return parseAllowlistPatterns(fromEnv)
  }
  return [getWebOnOneOrigin()]
}

/** Validate `return_url` for website → app SSO bridge (keep path + search). */
export function parseAppReturnUrl(raw: string | null): string | null {
  if (!raw) {
    return null
  }
  const params = new URLSearchParams()
  params.set('return_url', raw)
  return parseReturnUrl(params, getAppReturnAllowlist())
}

export function isAllowedAppOrigin(origin: string): boolean {
  return matchesAllowedOrigin(origin, getAppReturnAllowlist())
}

export function getAppHandoffFallbackUrl(): string {
  return `${getWebOnOneOrigin()}/auth/handoff`
}
