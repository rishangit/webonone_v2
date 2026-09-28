import {
  CatalogAttributeDetailScreen,
  useCatalogAttributeRouteParams,
} from '@/features/data/screens/CatalogAttributeDetailScreen'

export default function SpaceCatalogAttributeDetailRoute() {
  const { entityId, attributeId } = useCatalogAttributeRouteParams('spaceId')
  return (
    <CatalogAttributeDetailScreen
      kind="spaces"
      entityId={entityId}
      attributeId={attributeId}
    />
  )
}
