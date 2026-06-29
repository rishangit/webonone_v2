import { getIdentityApiBase } from './identityConfig'
import type { UserProfile } from '../types/auth.types'

export function getEmailHomeRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`
  }

  return 'http://localhost:3004/'
}

export async function bootstrapPlatformSession(code: string): Promise<{
  accessToken: string
  user: UserProfile & { avatarUrl?: string | null }
}> {
  const redirectUri = getEmailHomeRedirectUri()

  const res = await fetch(`${getIdentityApiBase()}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
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
