import { decodeJwtPayload, type PlatformRole } from '@webonone/platform-embed'

export function getSessionPlatformRole(accessToken: string | null): PlatformRole | null {
  if (!accessToken) {
    return null
  }
  const claims = decodeJwtPayload(accessToken)
  return claims?.platform_role ?? null
}

export function getSessionCompanyId(accessToken: string | null): string | null {
  if (!accessToken) {
    return null
  }
  const claims = decodeJwtPayload(accessToken)
  const companyId = claims?.company_id
  return companyId && companyId.length > 0 ? companyId : null
}

export function isSessionSuperAdmin(accessToken: string | null): boolean {
  return getSessionPlatformRole(accessToken) === 'super_admin'
}

export function isSessionCompanyAdmin(accessToken: string | null): boolean {
  return (
    getSessionPlatformRole(accessToken) === 'company_admin' &&
    Boolean(getSessionCompanyId(accessToken))
  )
}
