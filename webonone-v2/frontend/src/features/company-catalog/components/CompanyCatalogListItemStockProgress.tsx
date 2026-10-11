import type { StockAvailabilityProgressSize } from '@webonone/ui-kit'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import { CompanyCatalogProductListStockProgress } from '@/features/company-catalog/components/CompanyCatalogProductListStockProgress'

type CompanyCatalogListItemStockProgressProps = {
  companyProductId: string
  variantId: string
  quantity: number
  size?: StockAvailabilityProgressSize
  align?: 'start' | 'end'
}

export function CompanyCatalogListItemStockProgress({
  companyProductId,
  variantId,
  quantity,
  size = 'compact',
  align = 'end',
}: CompanyCatalogListItemStockProgressProps) {
  const { byVariantId } = useCompanyProductVariantStockLimitsMap(companyProductId)
  const limits = byVariantId[variantId]

  return (
    <CompanyCatalogProductListStockProgress
      quantity={quantity}
      size={size}
      align={align}
      maxQuantity={limits?.maxQuantity}
      minQuantity={limits?.minQuantity}
    />
  )
}
