export function getIdentityOrigin(): string {
  return import.meta.env.VITE_IDENTITY_ORIGIN ?? 'http://127.0.0.1:3011'
}

export function getIdentityLoginUrl(): string {
  return `${getIdentityOrigin()}/login`
}

export function getIdentityApiBase(): string {
  return import.meta.env.VITE_IDENTITY_API_BASE_URL ?? 'http://127.0.0.1:4011/api/v1'
}

export function getAuthCallbackUrl(): string {
  return `${window.location.origin}/callback`
}

import { expandLoopbackOrigins } from '@webonone/platform-nav'

const DEFAULT_ALLOWED_PARENT_ORIGINS =
  'http://127.0.0.1:3010,http://127.0.0.1:3011,http://127.0.0.1:3012,http://127.0.0.1:3013,http://127.0.0.1:3015,http://127.0.0.1:3017,http://127.0.0.1:3019,http://127.0.0.1:3021'

export function parseAllowedParentOrigins(): string[] {
  const raw = import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ?? DEFAULT_ALLOWED_PARENT_ORIGINS
  return expandLoopbackOrigins(
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )
}

export function isAllowedParentOrigin(origin: string): boolean {
  const allowed = parseAllowedParentOrigins()
  if (allowed.includes(origin)) {
    return true
  }
  try {
    const parsed = new URL(origin)
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return false
    }
    const alias = new URL(origin)
    alias.hostname = parsed.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
    return allowed.includes(alias.origin)
  } catch {
    return false
  }
}
