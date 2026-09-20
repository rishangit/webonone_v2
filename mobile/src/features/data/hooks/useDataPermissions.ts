import { useSession } from '@/features/auth/SessionContext'

export function useDataPermissions() {
  const { user } = useSession()
  const role = user?.role

  return {
    canCreateCatalog: role === 'super_admin' || role === 'company_admin',
    canEditCatalog: role === 'super_admin' || role === 'company_admin',
    canMutateReferenceData: role === 'super_admin',
    canDelete: role === 'super_admin',
    canSetStatus: role === 'super_admin',
  }
}
