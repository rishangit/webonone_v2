import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/store/hooks'
import type { SessionToken } from '@/features/calendar/types/event.types'
import {
  mergeSessionTokenAvatars,
  resolveSessionTokenAvatarMap,
} from '@/features/calendar/utils/resolveSessionTokenAvatars'
import { overlayIdentityFromSessionUser } from '@/shared/utils/overlayIdentityFromSessionUser'

export function useSessionTokenAvatars(tokens: SessionToken[]): SessionToken[] {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const sessionUser = useAppSelector((s) => s.auth.user)
  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string>>({})

  const missingUserIdsKey = useMemo(() => {
    const ids = tokens.filter((token) => !token.userAvatarUrl).map((token) => token.userId)
    return [...new Set(ids)].sort().join(',')
  }, [tokens])

  useEffect(() => {
    if (!accessToken || !missingUserIdsKey) {
      setAvatarByUserId({})
      return
    }

    const userIds = missingUserIdsKey.split(',').filter(Boolean)
    let cancelled = false

    void resolveSessionTokenAvatarMap(accessToken, userIds).then((map) => {
      if (!cancelled) setAvatarByUserId(map)
    })

    return () => {
      cancelled = true
    }
  }, [accessToken, missingUserIdsKey])

  return useMemo(
    () =>
      mergeSessionTokenAvatars(tokens, avatarByUserId).map((token) =>
        overlayIdentityFromSessionUser(token, sessionUser, {
          userId: 'userId',
          displayName: 'userDisplayName',
          email: 'userEmail',
          avatarUrl: 'userAvatarUrl',
        }),
      ),
    [avatarByUserId, sessionUser, tokens],
  )
}
