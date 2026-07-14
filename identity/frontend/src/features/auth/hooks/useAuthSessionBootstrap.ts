import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'

export function useAuthSessionBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (bootstrappedRef.current || !accessToken) return
    if (user) {
      bootstrappedRef.current = true
      return
    }
    bootstrappedRef.current = true
    dispatch(authActions.profileFetchRequested())
  }, [accessToken, dispatch, user])
}
