import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'

export function useSessionRoleBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { selectionComplete, loading } = useAppSelector((s) => s.sessionRole)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!accessToken) {
      startedRef.current = false
      dispatch(sessionRoleActions.reset())
      return
    }

    if (selectionComplete || loading || startedRef.current) {
      return
    }

    startedRef.current = true
    dispatch(sessionRoleActions.bootstrapStarted())

    void sessionRoleApi
      .getAssumableRoles()
      .then((result) => {
        dispatch(sessionRoleActions.rolesLoaded(result))
      })
      .catch(() => {
        dispatch(
          sessionRoleActions.rolesLoaded({
            roles: [{ role: 'member', companyId: null, label: 'Default User' }],
            hasCompanyMembership: false,
          }),
        )
      })
  }, [accessToken, dispatch, loading, selectionComplete])
}
