import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'

export function useAuthSessionBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (bootstrappedRef.current || !accessToken) return
    bootstrappedRef.current = true
    // Always refresh from `/auth/me` — cached/session user may be a JWT stub.
    dispatch(authActions.profileFetchRequested({ force: true }))
  }, [accessToken, dispatch])
}
