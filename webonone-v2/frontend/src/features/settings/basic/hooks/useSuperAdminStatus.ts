import { useAppSelector } from '@/app/store/hooks'

/**
 * Super-admin status is already known from the session role in the store —
 * derive it instead of calling `/company/admin/me` on every mount.
 */
export function useSuperAdminStatus() {
  const { activeRole, selectionComplete, loading } = useAppSelector((s) => s.sessionRole)

  return {
    isSuperAdmin: activeRole === 'super_admin',
    loading: loading || !selectionComplete,
  }
}
