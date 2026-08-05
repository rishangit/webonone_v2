import { env } from '../config/env.js'

export type IdentityUserContact = {
  id: string
  email: string | null
  displayName: string
}

function apiBase(): string | null {
  const raw = env.identityApiBaseUrl?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

/** Soft-degrade Identity contact lookup (display name + email). */
export async function fetchUserContact(userId: string): Promise<IdentityUserContact | null> {
  const base = apiBase()
  const apiKey = env.identityServiceApiKey
  if (!base || !apiKey) return null

  try {
    const res = await fetch(`${base}/api/v1/internal/users/${encodeURIComponent(userId)}/contact`, {
      headers: {
        'X-Identity-Service-Key': apiKey,
        Accept: 'application/json',
      },
    })
    if (res.status === 404 || !res.ok) return null
    const data = (await res.json()) as Partial<IdentityUserContact>
    if (!data.id) return null
    return {
      id: data.id,
      email: data.email ?? null,
      displayName: data.displayName?.trim() || data.email || userId,
    }
  } catch {
    return null
  }
}

export async function fetchUserContactsByIds(
  userIds: string[],
): Promise<Map<string, IdentityUserContact>> {
  const unique = [...new Set(userIds.filter(Boolean))]
  const map = new Map<string, IdentityUserContact>()
  await Promise.all(
    unique.map(async (id) => {
      const contact = await fetchUserContact(id)
      if (contact) map.set(id, contact)
    }),
  )
  return map
}
