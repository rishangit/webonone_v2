import { env } from '../config/env.js'

export type IdentityUserContact = {
  id: string
  email: string | null
  phoneNumber: string | null
  displayName: string
  avatarUrl: string | null
}

function apiBase(): string | null {
  if (!env.identityApiBaseUrl) {
    console.error('[identityUserContact] IDENTITY_API_BASE_URL not configured')
    return null
  }
  return env.identityApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function serviceHeaders(): Record<string, string> | null {
  if (!env.identityServiceApiKey) {
    console.error('[identityUserContact] IDENTITY_SERVICE_API_KEY not configured')
    return null
  }
  return {
    'Content-Type': 'application/json',
    'X-Identity-Service-Key': env.identityServiceApiKey,
  }
}

/**
 * Best-effort Identity contact lookup for email/SMS after session token issuance.
 * Returns null when Identity is unconfigured, unreachable, or the user is missing.
 */
export async function fetchUserContact(userId: string): Promise<IdentityUserContact | null> {
  const base = apiBase()
  const headers = serviceHeaders()
  if (!base || !headers) return null

  try {
    const res = await fetch(
      `${base}/api/v1/internal/users/${encodeURIComponent(userId)}/contact`,
      { headers },
    )
    if (res.status === 404) return null
    if (!res.ok) {
      const text = await res.text()
      console.error(`[identityUserContact] fetch failed (${res.status}): ${text}`)
      return null
    }
    const data = (await res.json()) as IdentityUserContact
    return {
      id: data.id,
      email: data.email ?? null,
      phoneNumber: data.phoneNumber ?? null,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl ?? null,
    }
  } catch (err) {
    console.error('[identityUserContact] fetch error:', err)
    return null
  }
}

/** Best-effort Identity profile avatars (e.g. Google OAuth picture) keyed by user id. */
export async function fetchUserAvatarsByIds(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) return new Map()

  const pairs = await Promise.all(
    uniqueIds.map(async (userId) => {
      const contact = await fetchUserContact(userId)
      const avatarUrl = contact?.avatarUrl?.trim()
      return avatarUrl ? ([userId, avatarUrl] as const) : null
    }),
  )

  return new Map(pairs.filter((entry): entry is [string, string] => entry !== null))
}
