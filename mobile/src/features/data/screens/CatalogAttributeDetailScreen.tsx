import { useLocalSearchParams } from 'expo-router'
import { CompanyCatalogAttributeDetailScreen } from '@/features/data/screens/CompanyCatalogAttributeDetailScreen'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

export function CatalogAttributeDetailScreen({
  kind,
  entityId,
  attributeId,
}: {
  kind: CatalogKind
  entityId: string
  attributeId: string
}) {
  const { isDataLibrarySession } = useDataCatalogScope()
  if (isDataLibrarySession) {
    return null
  }
  return (
    <CompanyCatalogAttributeDetailScreen
      kind={kind}
      entityId={entityId}
      attributeId={attributeId}
    />
  )
}

export function useCatalogAttributeRouteParams(paramKey: string) {
  const params = useLocalSearchParams<Record<string, string>>()
  const entityId = params[paramKey] ?? ''
  const attributeId = params.attributeId ?? ''
  return { entityId, attributeId }
}
