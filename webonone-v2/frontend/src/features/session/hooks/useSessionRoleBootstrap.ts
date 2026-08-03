import { useEffect, useRef } from 'react'
import { decodeJwtPayload } from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'

export function useSessionRoleBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { selectionComplete, loading, assumableRoles, activeRole, activeCompanyId } =
    useAppSelector((s) => s.sessionRole)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!accessToken) {
      dispatch(sessionRoleActions.reset())
      return
    }

    if (loading) {
      return
    }

    // Sticky selection restored — still load assumable roles for Change / Account tab.
    if (selectionComplete) {
      if (assumableRoles.length === 0) {
        dispatch(sessionRoleActions.bootstrapRequested())
      }
      return
    }

    dispatch(sessionRoleActions.bootstrapRequested())
  }, [accessToken, dispatch, loading, selectionComplete, assumableRoles.length])

  // Sticky company session can outlive a JWT that lacks company_id (e.g. login default
  // claims). Reissue so peer services like Design see company context.
  useEffect(() => {
    if (!accessToken || !selectionComplete || !activeRole || syncingRef.current) return

    const claims = decodeJwtPayload(accessToken)
    const jwtCompanyId = claims?.company_id ?? null
    const jwtRole = claims?.platform_role ?? null
    const needsCompanySync =
      Boolean(activeCompanyId) &&
      (jwtCompanyId !== activeCompanyId || jwtRole !== activeRole)
    const needsRoleSync = !activeCompanyId && jwtRole !== activeRole

    if (!needsCompanySync && !needsRoleSync) return

    syncingRef.current = true
    void sessionRoleApi
      .reissueSessionRole(accessToken, activeRole, activeCompanyId)
      .then((result) => {
        dispatch(authActions.tokenRefreshed({ accessToken: result.accessToken, user: result.user }))
      })
      .catch(() => {
        // Keep sticky UI selection; peer APIs may still fail until user re-selects account.
      })
      .finally(() => {
        syncingRef.current = false
      })
  }, [accessToken, activeCompanyId, activeRole, dispatch, selectionComplete])
}
