import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'

export function useSessionRoleBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { selectionComplete, loading } = useAppSelector((s) => s.sessionRole)

  useEffect(() => {
    if (!accessToken) {
      dispatch(sessionRoleActions.reset())
      return
    }

    if (selectionComplete || loading) {
      return
    }

    dispatch(sessionRoleActions.bootstrapRequested())
  }, [accessToken, dispatch, loading, selectionComplete])
}
