import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import {
  readSessionRoleStorage,
  WEBONONE_SESSION_ROLE_STORAGE_KEY,
} from '@/features/session/utils/sessionRoleStorage'

/**
 * Cross-tab sync for webonone_session_role:
 * when another tab selects an account, adopt the same role without re-opening the gate dialog.
 */
export function useSessionRoleStorageSync(): void {
  const dispatch = useAppDispatch()
  const userId = useAppSelector((s) => s.auth.user?.id)
  const { activeRole, activeCompanyId, selectionComplete } = useAppSelector((s) => s.sessionRole)

  useEffect(() => {
    function adoptStoredSelection() {
      if (!userId) {
        return
      }

      const stored = readSessionRoleStorage()
      if (!stored?.selectionComplete) {
        return
      }
      if (stored.userId && stored.userId !== userId) {
        return
      }
      if (
        selectionComplete &&
        activeRole === stored.activeRole &&
        activeCompanyId === stored.activeCompanyId
      ) {
        return
      }

      dispatch(
        sessionRoleActions.restoredFromStorage({
          role: stored.activeRole,
          companyId: stored.activeCompanyId,
        }),
      )
    }

    function onStorage(event: StorageEvent) {
      if (event.storageArea !== localStorage) {
        return
      }
      if (event.key !== WEBONONE_SESSION_ROLE_STORAGE_KEY) {
        return
      }

      if (event.newValue == null || event.newValue === '') {
        dispatch(sessionRoleActions.reset())
        return
      }

      adoptStoredSelection()
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [activeCompanyId, activeRole, dispatch, selectionComplete, userId])
}
