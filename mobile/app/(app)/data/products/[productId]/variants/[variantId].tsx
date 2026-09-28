import { Redirect, useLocalSearchParams, type Href } from 'expo-router'
import { CompanyProductVariantDetailScreen } from '@/features/data/screens/CompanyProductVariantDetailScreen'
import { catalogListPath } from '@/features/data/utils/dataPaths'

export default function CompanyProductVariantDetailRoute() {
  const { productId, variantId } = useLocalSearchParams<{ productId: string; variantId: string }>()

  if (!productId || !variantId) {
    return <Redirect href={catalogListPath('products') as Href} />
  }

  return <CompanyProductVariantDetailScreen productId={productId} variantId={variantId} />
}
