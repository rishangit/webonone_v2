import { expandLoopbackOrigins, matchesAllowedOrigin } from '@webonone/platform-nav'

export function getWebOnOneOrigin(): string {
  return import.meta.env.VITE_WEBONONE_ORIGIN ?? 'http://127.0.0.1:3010'
}

export function getWebsiteOrigin(): string {
  return (import.meta.env.VITE_WEBSITE_ORIGIN ?? 'http://127.0.0.1:3018').replace(/\/$/, '')
}

export function parseAllowedParentOrigins(): string[] {
  const raw =
    import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ??
    'http://127.0.0.1:3010,http://127.0.0.1:3011,http://127.0.0.1:3012,http://127.0.0.1:3018'
  return expandLoopbackOrigins(
    raw
      .split(',')
      .map((entry: string) => entry.trim())
      .filter(Boolean),
  )
}

export function isAllowedParentOrigin(origin: string): boolean {
  return matchesAllowedOrigin(origin, parseAllowedParentOrigins())
}
