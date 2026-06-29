export function getIdentityOrigin(): string {
  return import.meta.env.VITE_IDENTITY_ORIGIN ?? 'http://localhost:3001'
}

export function getIdentityLoginUrl(): string {
  return `${getIdentityOrigin()}/login`
}

export function getIdentityApiBase(): string {
  return import.meta.env.VITE_IDENTITY_API_BASE_URL ?? 'http://localhost:4001/api/v1'
}

export function getIdentityProfileUrl(): string {
  return `${getIdentityOrigin()}/profile`
}

export function getAuthCallbackUrl(): string {
  return `${window.location.origin}/callback`
}

export function getWebOnOneOrigin(): string {
  return import.meta.env.VITE_WEBONONE_ORIGIN ?? 'http://localhost:3000'
}

export function parseAllowedParentOrigins(): string[] {
  const raw =
    import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ??
    'http://localhost:3000,http://localhost:3001,http://localhost:3004'
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function isAllowedParentOrigin(origin: string): boolean {
  return parseAllowedParentOrigins().includes(origin)
}
