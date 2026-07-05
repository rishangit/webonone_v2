import { getIdentityApiBase } from './identityConfig'
import type { DataRole, UserProfile } from '../types/auth.types'

export function getDataRedirectUri(path = '/'): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    if (path === '/' || path === '') {
      return `${origin}/`
    }
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`
  }

  return 'http://localhost:3005/'
}

/** @deprecated Use getDataRedirectUri('/') */
export function getDataHomeRedirectUri(): string {
  return getDataRedirectUri('/')
}

export async function bootstrapPlatformSession(
  code: string,
  redirectUri?: string,
): Promise<{
  accessToken: string
  user: UserProfile & { avatarUrl?: string | null }
  platformRole?: DataRole
  companyId?: string | null
}> {
  const uri = redirectUri ?? getDataRedirectUri('/')

  const res = await fetch(`${getIdentityApiBase()}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: uri }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    accessToken?: string
    user?: UserProfile & { avatarUrl?: string | null }
    platformRole?: DataRole
    companyId?: string | null
    message?: string
  }

  if (!res.ok || !data.accessToken || !data.user) {
    throw new Error(data.message ?? `Token exchange failed (${res.status})`)
  }

  return {
    accessToken: data.accessToken,
    user: data.user,
    platformRole: data.platformRole,
    companyId: data.companyId,
  }
}
