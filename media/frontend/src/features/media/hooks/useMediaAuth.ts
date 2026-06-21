import { useEffect } from 'react'
import { MEDIA_MESSAGE_TYPES } from '@webonone/media-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export function useMediaAuth(isEmbed: boolean) {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  useEffect(() => {
    if (!isEmbed) {
      return
    }

    function handleInit(event: MessageEvent) {
      if (!isAllowedParentOrigin(event.origin)) {
        return
      }
      const data = event.data as { type?: string; accessToken?: string }
      if (data.type !== MEDIA_MESSAGE_TYPES.INIT || !data.accessToken) {
        return
      }
      dispatch(authActions.setAccessToken(data.accessToken))
    }

    window.addEventListener('message', handleInit)
    return () => window.removeEventListener('message', handleInit)
  }, [dispatch, isEmbed])

  return { accessToken, isAuthenticated: Boolean(accessToken) }
}
