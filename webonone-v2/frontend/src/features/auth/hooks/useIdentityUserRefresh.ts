import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { fetchIdentityUser } from '../services/identityUserApi'
import { authActions } from '../store/authSlice'

export function useIdentityUserRefresh() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (!accessToken) return

    async function refresh() {
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        const user = await fetchIdentityUser(accessToken!)
        dispatch(authActions.userProfileUpdated(user))
      } catch {
        // Keep cached profile when refresh fails (offline, expired token, etc.)
      } finally {
        inFlightRef.current = false
      }
    }

    void refresh()

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [accessToken, dispatch])
}
