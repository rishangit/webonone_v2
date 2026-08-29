import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { readServiceAuthSession } from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  WEBONONE_AUTH_STORAGE_KEY,
  authActions,
  clearWebOnOneAuthStorage,
} from '@/features/auth/store/authSlice'
import type { UserProfile } from '@/features/auth/types/auth.types'
import { clearSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'

const LOG = '[webonone-auth]'

/**
 * Cross-tab session sync for webonone_auth:
 * - SET from another tab (e.g. website login wrote webonone_auth) → adopt login
 * - CLEAR from clear-session / logout → logout this tab to /login?prompt=login
 */
export function useAuthStorageSync(): void {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const userId = useAppSelector((s) => s.auth.user?.id)
  const tokenRef = useRef(accessToken)
  const userIdRef = useRef(userId)
  tokenRef.current = accessToken
  userIdRef.current = userId

  useEffect(() => {
    console.log(LOG, 'storage sync mounted', {
      hasToken: Boolean(tokenRef.current),
    })

    function onStorage(event: StorageEvent) {
      if (event.storageArea !== localStorage) {
        return
      }
      if (event.key !== WEBONONE_AUTH_STORAGE_KEY) {
        return
      }

      // Another tab logged in (website login hop through app, or Open App handoff).
      if (event.newValue != null && event.newValue !== '') {
        const session = readServiceAuthSession<UserProfile>(WEBONONE_AUTH_STORAGE_KEY)
        if (!session?.accessToken || !session.user) {
          console.warn(LOG, 'storage SET but unreadable session')
          return
        }
        if (tokenRef.current === session.accessToken) {
          return
        }
        console.log(LOG, 'storage SET → adopt session from other tab', {
          userId: session.user.id,
          hadToken: Boolean(tokenRef.current),
        })
        if (tokenRef.current) {
          if (userIdRef.current && userIdRef.current === session.user.id) {
            dispatch(
              authActions.tokenRefreshed({
                accessToken: session.accessToken,
                user: session.user,
              }),
            )
          } else {
            dispatch(
              authActions.loginSuccess({
                accessToken: session.accessToken,
                user: session.user,
              }),
            )
          }
        } else {
          dispatch(
            authActions.loginSuccess({
              accessToken: session.accessToken,
              user: session.user,
            }),
          )
        }
        return
      }

      // Cleared by clear-session or logout in another tab.
      if (!tokenRef.current) {
        console.log(LOG, 'storage CLEAR ignored (already guest)')
        return
      }
      console.log(LOG, 'storage CLEAR → logout this tab')
      clearWebOnOneAuthStorage()
      clearSessionRoleStorage()
      dispatch(authActions.logout())
      navigate('/login?prompt=login', { replace: true })
    }

    function maybeAdoptFromStorage(reason: string) {
      if (tokenRef.current) {
        return
      }
      const session = readServiceAuthSession<UserProfile>(WEBONONE_AUTH_STORAGE_KEY)
      if (!session?.accessToken || !session.user) {
        return
      }
      console.log(LOG, 'visibility adopt webonone_auth', {
        reason,
        userId: session.user.id,
      })
      dispatch(
        authActions.loginSuccess({
          accessToken: session.accessToken,
          user: session.user,
        }),
      )
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        maybeAdoptFromStorage('visibilitychange')
      }
    }

    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [dispatch, navigate])
}
