import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'

export function useIdentityUserRefresh() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  useEffect(() => {
    if (!accessToken) return

    dispatch(authActions.profileFetchRequested(undefined))

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        dispatch(authActions.profileFetchRequested({ force: true }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [accessToken, dispatch])
}
