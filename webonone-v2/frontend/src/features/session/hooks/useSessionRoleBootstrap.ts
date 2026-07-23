import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'

export function useSessionRoleBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { selectionComplete, loading, assumableRoles } = useAppSelector((s) => s.sessionRole)

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
}
