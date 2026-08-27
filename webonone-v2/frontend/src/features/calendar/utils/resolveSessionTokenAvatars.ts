import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import type { SessionToken } from '@/features/calendar/types/event.types'

type IdentityUserResponse = {
  user?: {
    avatarUrl?: string | null
  }
}

async function fetchIdentityUserAvatar(
  accessToken: string,
  userId: string,
): Promise<string | null> {
  const res = await fetch(`${getIdentityApiBase()}/users/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  const data = (await res.json().catch(() => ({}))) as IdentityUserResponse
  return data.user?.avatarUrl ?? null
}

export async function resolveSessionTokenAvatarMap(
  accessToken: string,
  userIds: string[],
): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) return {}

  const pairs = await Promise.all(
    uniqueIds.map(async (userId) => {
      const avatarUrl = await fetchIdentityUserAvatar(accessToken, userId)
      return avatarUrl ? ([userId, avatarUrl] as const) : null
    }),
  )

  return Object.fromEntries(pairs.filter((entry): entry is [string, string] => entry !== null))
}

export function mergeSessionTokenAvatars(
  tokens: SessionToken[],
  avatarByUserId: Record<string, string>,
): SessionToken[] {
  if (Object.keys(avatarByUserId).length === 0) return tokens
  return tokens.map((token) => ({
    ...token,
    userAvatarUrl: token.userAvatarUrl ?? avatarByUserId[token.userId] ?? null,
  }))
}
