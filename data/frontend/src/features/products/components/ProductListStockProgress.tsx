import {
  StockAvailabilityProgress,
  type StockAvailabilityProgressSize,
} from '@webonone/ui-kit'
import { formatProductListStockAvailability } from '@/features/products/utils/productListStockLine'

type ProductListStockProgressProps = {
  quantity: number
  size?: StockAvailabilityProgressSize
  align?: 'start' | 'end'
  maxQuantity?: number | null
  minQuantity?: number | null
  caption?: string
  translate: (key: 'list.stockAvailable' | 'list.stockOut', options?: { quantity: number }) => string
}

export function ProductListStockProgress({
  quantity,
  size = 'compact',
  align = 'end',
  maxQuantity,
  minQuantity,
  caption,
  translate,
}: ProductListStockProgressProps) {
  return (
    <StockAvailabilityProgress
      size={size}
      align={align}
      className={size === 'full' ? 'w-full max-w-none self-stretch' : undefined}
      quantity={quantity}
      maxQuantity={maxQuantity}
      minQuantity={minQuantity}
      caption={
        caption ??
        (maxQuantity != null && maxQuantity > 0
          ? undefined
          : formatProductListStockAvailability(quantity, translate))
      }
    />
  )
}
