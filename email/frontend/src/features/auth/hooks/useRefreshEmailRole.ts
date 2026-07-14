import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'

export function useRefreshEmailRole(isBootstrapping: boolean): boolean {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const isProfileLoading = useAppSelector((s) => s.auth.isProfileLoading)

  useEffect(() => {
    if (!accessToken || isBootstrapping) return
    if (userRole) return
    dispatch(authActions.profileFetchRequested())
  }, [accessToken, dispatch, isBootstrapping, userRole])

  if (!accessToken) return true
  if (isBootstrapping) return false
  if (userRole) return true
  return !isProfileLoading
}
