import {
  CatalogAttributeDetailScreen,
  useCatalogAttributeRouteParams,
} from '@/features/data/screens/CatalogAttributeDetailScreen'

export default function ProductCatalogAttributeDetailRoute() {
  const { entityId, attributeId } = useCatalogAttributeRouteParams('productId')
  return (
    <CatalogAttributeDetailScreen
      kind="products"
      entityId={entityId}
      attributeId={attributeId}
    />
  )
}
