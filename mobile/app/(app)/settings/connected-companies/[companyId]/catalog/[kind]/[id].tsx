import { Redirect, useLocalSearchParams } from 'expo-router'
import type { Href } from 'expo-router'
import { CompanyCatalogDetailScreen } from '@/features/data/screens/CompanyCatalogDetailScreen'
import type { CatalogKind } from '@/features/data/utils/dataPaths'
import { CONNECTED_COMPANIES_PATH } from '@/features/companies/utils/companyPaths'

const CATALOG_KINDS: CatalogKind[] = ['products', 'services', 'spaces']

function isCatalogKind(value: string): value is CatalogKind {
  return (CATALOG_KINDS as readonly string[]).includes(value)
}

export default function ConnectedCompanyCatalogItemRoute() {
  const { companyId, kind, id } = useLocalSearchParams<{
    companyId: string
    kind: string
    id: string
  }>()

  if (!companyId?.trim() || !id?.trim() || !kind?.trim() || !isCatalogKind(kind)) {
    return <Redirect href={CONNECTED_COMPANIES_PATH as Href} />
  }

  return (
    <CompanyCatalogDetailScreen
      kind={kind}
      itemId={id}
      membershipCompanyId={companyId}
    />
  )
}
