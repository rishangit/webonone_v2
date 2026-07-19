import { decodeJwtPayload, type PlatformRole } from '@webonone/platform-embed'

export function getSessionPlatformRole(accessToken: string | null): PlatformRole | null {
  if (!accessToken) {
    return null
  }
  const claims = decodeJwtPayload(accessToken)
  return claims?.platform_role ?? null
}

export function isSessionSuperAdmin(accessToken: string | null): boolean {
  return getSessionPlatformRole(accessToken) === 'super_admin'
}
