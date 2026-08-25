export type PlatformRole = 'super_admin' | 'company_admin' | 'member'

export type AccessTokenClaims = {
  sub: string
  email: string
  platform_role?: PlatformRole
  company_id?: string | null
  impersonated_by?: string
  exp?: number
  iss?: string
  aud?: string
}

const EXPIRY_SKEW_SECONDS = 30

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

export function decodeJwtPayload(token: string): AccessTokenClaims | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as AccessTokenClaims
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function isAccessTokenExpired(token: string, skewSeconds = EXPIRY_SKEW_SECONDS): boolean {
  const claims = decodeJwtPayload(token)
  if (!claims?.exp) {
    return true
  }
  const nowSeconds = Math.floor(Date.now() / 1000)
  return claims.exp <= nowSeconds + skewSeconds
}
