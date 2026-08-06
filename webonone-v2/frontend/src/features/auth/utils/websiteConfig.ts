import { matchesAllowedOrigin, parseAllowlistPatterns, parseReturnUrl } from '@webonone/platform-nav'

const DEFAULT_WEBSITE_ORIGIN = 'http://127.0.0.1:3018'

export function getWebsiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_WEBSITE_ORIGIN?.trim()
  return (fromEnv || DEFAULT_WEBSITE_ORIGIN).replace(/\/$/, '')
}

/** Origins allowed for website login return_url and silent SSO parentOrigin. */
export function getWebsiteAllowedOriginPatterns(): string[] {
  const fromEnv = import.meta.env.VITE_WEBSITE_ALLOWED_ORIGINS?.trim()
  if (fromEnv) {
    return parseAllowlistPatterns(fromEnv)
  }
  return [getWebsiteOrigin()]
}

export function isAllowedWebsiteOrigin(origin: string): boolean {
  return matchesAllowedOrigin(origin, getWebsiteAllowedOriginPatterns())
}

/**
 * Validate `return_url` query for website login handoff.
 * Keeps pathname + search on allowlisted origins (does not strip to origin root).
 */
export function parseWebsiteReturnUrl(raw: string | null): string | null {
  if (!raw) {
    return null
  }

  const params = new URLSearchParams()
  params.set('return_url', raw)
  return parseReturnUrl(params, getWebsiteAllowedOriginPatterns())
}

/** Website homepage when a return_url was intended but failed validation. */
export function getWebsiteHomepageUrl(): string {
  return `${getWebsiteOrigin()}/`
}

/**
 * Resolve website return target from raw query.
 * Valid deep URL wins; if raw was present but invalid, fall back to website home (not WebOnOne `/`).
 */
export function resolveWebsiteReturnTarget(raw: string | null): {
  websiteReturnUrl: string | null
  /** True when the guest came from a website login handoff (valid or invalid return_url). */
  hasWebsiteReturnIntent: boolean
} {
  if (!raw?.trim()) {
    return { websiteReturnUrl: null, hasWebsiteReturnIntent: false }
  }
  const parsed = parseWebsiteReturnUrl(raw)
  if (parsed) {
    return { websiteReturnUrl: parsed, hasWebsiteReturnIntent: true }
  }
  return { websiteReturnUrl: getWebsiteHomepageUrl(), hasWebsiteReturnIntent: true }
}
