import { useSession } from '@/features/auth/SessionContext'

export function useDesignPermissions() {
  const { user } = useSession()
  const role = user?.role
  const canManage = role === 'super_admin' || role === 'company_admin'
  const isSuperAdmin = role === 'super_admin'

  return {
    canManage,
    isSuperAdmin,
    hasCompany: Boolean(user?.companyId),
    userId: user?.id ?? null,
  }
}
