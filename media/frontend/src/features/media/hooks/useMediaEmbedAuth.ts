import { useCallback } from 'react'
import {
  decodeJwtPayload,
  usePlatformEmbedAuth,
  type ServiceAuthSession,
} from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions, MEDIA_AUTH_STORAGE_KEY } from '@/features/auth/store/authSlice'
import type { UserProfile } from '@/features/auth/types/auth.types'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { EmbedModeState } from './useEmbedMode'

function userFromClaims(claims: NonNullable<ReturnType<typeof decodeJwtPayload>>): UserProfile {
  return {
    id: claims.sub,
    email: claims.email,
    displayName: claims.email,
    avatarUrl: null,
  }
}

export function useMediaEmbedAuth(embed: Pick<EmbedModeState, 'isEmbed' | 'parentOrigin'>) {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  const handleAccessToken = useCallback(
    (token: string) => {
      const claims = decodeJwtPayload(token)
      if (!claims) {
        return
      }
      dispatch(
        authActions.loginSuccess({
          accessToken: token,
          user: userFromClaims(claims),
        }),
      )
    },
    [dispatch],
  )

  const handlePersistedSession = useCallback(
    (session: ServiceAuthSession) => {
      dispatch(
        authActions.loginSuccess({
          accessToken: session.accessToken,
          user: session.user as UserProfile,
        }),
      )
    },
    [dispatch],
  )

  usePlatformEmbedAuth({
    parentOrigin: embed.isEmbed ? embed.parentOrigin : null,
    isAllowedParentOrigin,
    persistedAccessToken: accessToken,
    onAccessToken: handleAccessToken,
    authStorageKey: MEDIA_AUTH_STORAGE_KEY,
    onPersistedSession: handlePersistedSession,
  })

  return { accessToken }
}
