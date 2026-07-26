import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthCancelMessage, isAuthSuccessMessage } from '@webonone/platform-embed'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import { getIdentityOrigin } from '../utils/identityConfig'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

type UseIdentityAuthMessageOptions = {
  returnPath?: string
  onCancel?: () => void
}

/**
 * Listen for Identity login iframe postMessage handoff.
 */
export function useIdentityAuthMessage({
  returnPath = '/',
  onCancel,
}: UseIdentityAuthMessageOptions = {}): void {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const handledRef = useRef(false)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    const identityOrigin = normalizeOrigin(getIdentityOrigin())

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }

      if (isAuthSuccessMessage(event.data)) {
        if (handledRef.current) {
          return
        }
        handledRef.current = true
        dispatch(
          authActions.loginSuccess({
            accessToken: event.data.accessToken,
            user: {
              id: event.data.user.id,
              email: event.data.user.email,
              displayName: event.data.user.displayName,
              avatarUrl: event.data.user.avatarUrl ?? null,
            },
          }),
        )
        navigate(returnPath || '/', { replace: true })
        return
      }

      if (isAuthCancelMessage(event.data)) {
        onCancelRef.current?.()
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatch, navigate, returnPath])
}
