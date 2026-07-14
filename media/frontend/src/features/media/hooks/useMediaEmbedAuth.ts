import { useCallback } from 'react'
import { usePlatformEmbedAuth } from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { EmbedModeState } from './useEmbedMode'

export function useMediaEmbedAuth(embed: Pick<EmbedModeState, 'isEmbed' | 'parentOrigin'>) {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  const handleAccessToken = useCallback(
    (token: string) => {
      dispatch(authActions.setAccessToken(token))
    },
    [dispatch],
  )

  const { isAwaitingToken } = usePlatformEmbedAuth({
    parentOrigin: embed.isEmbed ? embed.parentOrigin : null,
    isAllowedParentOrigin,
    persistedAccessToken: accessToken,
    onAccessToken: handleAccessToken,
  })

  return {
    accessToken,
    isAuthenticated: Boolean(accessToken),
    isAwaitingToken: embed.isEmbed && isAwaitingToken,
  }
}
