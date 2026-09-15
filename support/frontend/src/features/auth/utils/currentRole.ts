type JwtPayload = {
  platform_role?: string
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getSessionPlatformRole(accessToken: string | null): string | null {
  if (!accessToken) return null
  return decodeJwtPayload(accessToken)?.platform_role ?? null
}

export function isSessionSuperAdmin(accessToken: string | null): boolean {
  return getSessionPlatformRole(accessToken) === 'super_admin'
}
