import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { apiClient } from '@/shared/services/apiClient'

export function useRefreshEmailRole(isBootstrapping: boolean): boolean {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [roleReady, setRoleReady] = useState(!accessToken)

  useEffect(() => {
    if (!accessToken || isBootstrapping) {
      setRoleReady(!accessToken)
      return
    }

    let cancelled = false
    setRoleReady(false)

    apiClient<{ user: { role: EmailRole } }>('/me')
      .then((me) => {
        if (!cancelled) {
          dispatch(authActions.setUserRole(me.user.role))
          setRoleReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoleReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, dispatch, isBootstrapping])

  return roleReady
}
