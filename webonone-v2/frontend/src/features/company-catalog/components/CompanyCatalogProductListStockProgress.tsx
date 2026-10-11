import { useTranslation } from 'react-i18next'
import { StockAvailabilityProgress, type StockAvailabilityProgressSize } from '@webonone/ui-kit'
import { formatCompanyProductListStockAvailability } from '@/features/company-catalog/utils/companyCatalogProductListStockLine'

type CompanyCatalogProductListStockProgressProps = {
  quantity: number
  size?: StockAvailabilityProgressSize
  align?: 'start' | 'end'
  maxQuantity?: number | null
  minQuantity?: number | null
  caption?: string
}

export function CompanyCatalogProductListStockProgress({
  quantity,
  size = 'compact',
  align = 'end',
  maxQuantity,
  minQuantity,
  caption,
}: CompanyCatalogProductListStockProgressProps) {
  const { t } = useTranslation('catalog')
  const isFull = size === 'full'
  return (
    <StockAvailabilityProgress
      size={size}
      align={align}
      className={isFull ? 'stock-availability-progress-full' : undefined}
      quantity={quantity}
      maxQuantity={maxQuantity}
      minQuantity={minQuantity}
      caption={
        caption ??
        (maxQuantity != null && maxQuantity > 0
          ? undefined
          : formatCompanyProductListStockAvailability(quantity, t))
      }
    />
  )
}
