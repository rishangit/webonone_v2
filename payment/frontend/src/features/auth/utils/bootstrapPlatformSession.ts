import { getIdentityApiBase } from './identityConfig'
import type { UserProfile } from '../types/auth.types'

export function getPaymentRedirectUri(path = '/'): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    if (path === '/' || path === '') {
      return `${origin}/`
    }
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`
  }

  return 'http://localhost:3017/'
}

export async function bootstrapPlatformSession(
  code: string,
  redirectUri?: string,
): Promise<{
  accessToken: string
  user: UserProfile & { avatarUrl?: string | null }
}> {
  const uri = redirectUri ?? getPaymentRedirectUri('/')

  const res = await fetch(`${getIdentityApiBase()}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: uri }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    accessToken?: string
    user?: UserProfile & { avatarUrl?: string | null }
    message?: string
  }

  if (!res.ok || !data.accessToken || !data.user) {
    throw new Error(data.message ?? `Token exchange failed (${res.status})`)
  }

  return { accessToken: data.accessToken, user: data.user }
}
