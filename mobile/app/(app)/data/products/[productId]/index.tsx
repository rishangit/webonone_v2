import { CatalogDetailScreen } from '@/features/data/screens/CatalogDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DataProductDetailRoute() {
  const { productId } = useLocalSearchParams<{ productId: string }>()
  return <CatalogDetailScreen kind="products" itemId={productId} />
}
