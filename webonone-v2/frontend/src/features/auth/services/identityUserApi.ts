import type { UserProfile } from '../types/auth.types'
import { getIdentityApiBase } from '../utils/identityConfig'

interface IdentityMeResponse {
  user?: UserProfile
  message?: string
}

export async function fetchIdentityUser(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${getIdentityApiBase()}/auth/me`, {
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
    locale: data.user.locale ?? null,
  }
}

export async function patchIdentityLocale(
  accessToken: string,
  locale: 'en' | 'si',
): Promise<UserProfile> {
  const res = await fetch(`${getIdentityApiBase()}/auth/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ locale }),
  })

  const data = (await res.json().catch(() => ({}))) as IdentityMeResponse
  if (!res.ok || !data.user) {
    throw new Error(data.message ?? `Failed to update locale (${res.status})`)
  }

  return {
    id: data.user.id,
    email: data.user.email,
    displayName: data.user.displayName,
    avatarUrl: data.user.avatarUrl ?? null,
    locale: data.user.locale ?? null,
  }
}
