import { decodeJwtPayload } from '@webonone/platform-embed'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import type { UserProfile } from '@/features/auth/types/auth.types'

export function isImpersonatingSession(accessToken: string | null | undefined): boolean {
  if (!accessToken) {
    return false
  }
  const claims = decodeJwtPayload(accessToken)
  return Boolean(claims?.impersonated_by)
}

export async function stopImpersonation(accessToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserProfile
}> {
  const res = await fetch(`${getIdentityApiBase()}/auth/stop-impersonate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(data.message ?? `Failed to stop impersonation (${res.status})`)
  }
  return res.json() as Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    user: UserProfile
  }>
}
