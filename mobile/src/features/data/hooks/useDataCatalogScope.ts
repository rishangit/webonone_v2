import { useSession } from '@/features/auth/SessionContext'

/** Mirrors WebOnOne `DataCatalogListRoute`: super_admin → Data library; company session → company catalog. */
export function useDataCatalogScope() {
  const { user } = useSession()
  const role = user?.role

  return {
    isDataLibrarySession: role === 'super_admin',
    canManageCompanyCatalog: role === 'company_admin',
    isCompanyCatalogReadOnly: role === 'member',
  }
}
