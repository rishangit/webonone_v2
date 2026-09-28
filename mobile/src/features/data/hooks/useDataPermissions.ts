import { useSession } from '@/features/auth/SessionContext'

export function useDataPermissions() {
  const { user } = useSession()
  const role = user?.role
  const isDataLibrarySession = role === 'super_admin'

  return {
    canCreateCatalog: isDataLibrarySession || role === 'company_admin',
    canEditCatalog: isDataLibrarySession || role === 'company_admin',
    canMutateReferenceData: isDataLibrarySession,
    canDelete: isDataLibrarySession,
    canSetStatus: isDataLibrarySession,
    canRemoveCompanyCatalog: role === 'company_admin',
  }
}
