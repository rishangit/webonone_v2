import {
  CatalogAttributeDetailScreen,
  useCatalogAttributeRouteParams,
} from '@/features/data/screens/CatalogAttributeDetailScreen'

export default function ServiceCatalogAttributeDetailRoute() {
  const { entityId, attributeId } = useCatalogAttributeRouteParams('serviceId')
  return (
    <CatalogAttributeDetailScreen
      kind="services"
      entityId={entityId}
      attributeId={attributeId}
    />
  )
}
