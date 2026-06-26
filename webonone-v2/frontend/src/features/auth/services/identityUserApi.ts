import type { UserProfile } from '../types/auth.types'
import { getIdentityApiBase } from '../utils/identityConfig'

interface IdentityMeResponse {
  user?: UserProfile
  message?: string
}

export async function fetchIdentityUser(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${getIdentityApiBase()}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const data = (await res.json().catch(() => ({}))) as IdentityMeResponse
  if (!res.ok || !data.user) {
    throw new Error(data.message ?? `Failed to load profile (${res.status})`)
  }

  return {
    id: data.user.id,
    email: data.user.email,
    displayName: data.user.displayName,
    avatarUrl: data.user.avatarUrl ?? null,
  }
}
