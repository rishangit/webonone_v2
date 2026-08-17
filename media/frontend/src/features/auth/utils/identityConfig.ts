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

export function parseAllowedParentOrigins(): string[] {
  const raw =
    import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ??
    'http://127.0.0.1:3010,http://127.0.0.1:3011,http://127.0.0.1:3012,http://127.0.0.1:3013,http://127.0.0.1:3015,http://127.0.0.1:3017,http://127.0.0.1:3019'
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function isAllowedParentOrigin(origin: string): boolean {
  return parseAllowedParentOrigins().includes(origin)
}
