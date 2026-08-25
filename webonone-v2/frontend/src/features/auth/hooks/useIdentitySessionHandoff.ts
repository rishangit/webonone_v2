import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthSuccessMessage } from '@webonone/platform-embed'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import { getIdentityOrigin } from '../utils/identityConfig'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

/**
 * Listen for Identity embed auth handoff (login + super-admin impersonation).
 */
export function useIdentitySessionHandoff(): void {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const identityOrigin = normalizeOrigin(getIdentityOrigin())

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }

      if (!isAuthSuccessMessage(event.data)) {
        return
      }

      dispatch(
        authActions.loginSuccess({
          accessToken: event.data.accessToken,
          user: {
            id: event.data.user.id,
            email: event.data.user.email,
            displayName: event.data.user.displayName,
            avatarUrl: event.data.user.avatarUrl ?? null,
            locale: event.data.user.locale ?? null,
          },
        }),
      )

      navigate('/', { replace: true })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatch, navigate])
}
