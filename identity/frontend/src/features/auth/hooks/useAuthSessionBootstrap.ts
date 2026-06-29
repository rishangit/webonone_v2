import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authApi } from '../services/authApi'
import { authActions } from '../store/authSlice'

export function useAuthSessionBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (bootstrappedRef.current || !accessToken) return
    bootstrappedRef.current = true

    authApi
      .getMe(accessToken)
      .then((result) => {
        dispatch(authActions.profileFetchSucceeded(result.user))
      })
      .catch(() => {
        dispatch(authActions.logout())
      })
  }, [accessToken, dispatch])
}
