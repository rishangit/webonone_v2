import { useSession } from '@/features/auth/SessionContext'

export function useDesignPermissions() {
  const { user } = useSession()
  const role = user?.role
  const canManage = role === 'super_admin' || role === 'company_admin'

  return {
    canManage,
    hasCompany: Boolean(user?.companyId),
    userId: user?.id ?? null,
  }
}
