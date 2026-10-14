import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PriceDisplay,
  StockAvailabilityProgress,
} from '@webonone/ui-kit'
import {
  formatProductListStockAvailability,
  getActiveProductListLine,
  resolveProductListUnitPrice,
} from '@/features/products/utils/productListStockLine'
import type { ProductListStockDisplay } from '@/features/products/utils/resolveProductListStockDisplay'

type ProductListVariantStockProps = {
  productId: string
  meta: ProductListStockDisplay | undefined
  listPrice?: number | null
  selectedVariantId: string | undefined
  onSelectVariant: (productId: string, variantId: string) => void
  /** When false, price is shown elsewhere (e.g. right-aligned list column). Default true. */
  showPrice?: boolean
  /** When false, stock is shown elsewhere (e.g. grid stock column). Default true. */
  showStock?: boolean
  /** List row: variant control flush right with intrinsic width. */
  align?: 'start' | 'end'
  maxQuantity?: number | null
  minQuantity?: number | null
  /** Card layout: stretch variant control and optional stock bar to the card body width. */
  fullWidth?: boolean
  stockSize?: 'compact' | 'full'
}

function stopRowNavigation(event: SyntheticEvent) {
  event.stopPropagation()
}

export function ProductListVariantStock({
  productId,
  meta,
  listPrice,
  selectedVariantId,
  onSelectVariant,
  showPrice = true,
  showStock = true,
  align = 'start',
  maxQuantity,
  minQuantity,
  fullWidth = false,
  stockSize = 'compact',
}: ProductListVariantStockProps) {
  const { t } = useTranslation('products')

  const activeLine = getActiveProductListLine(meta, selectedVariantId)
  if (!meta || !activeLine) return null

  const unitPrice = resolveProductListUnitPrice(activeLine, listPrice)
  const quantity = activeLine.totalQuantity

  const alignEnd = align === 'end'

  const stockBarSize: 'compact' | 'full' =
    showStock ? (fullWidth ? 'full' : stockSize) : 'compact'

  return (
    <div
      className={
        fullWidth
          ? 'mt-1 flex w-full min-w-0 flex-col items-stretch gap-1'
          : alignEnd
            ? 'mt-1 flex w-fit max-w-full flex-col items-end gap-1'
            : 'mt-1 flex flex-col gap-1'
      }
      onClick={stopRowNavigation}
      onKeyDown={stopRowNavigation}
      role="presentation"
    >
      {meta.variantCount > 1 ? (
        <Select
          value={activeLine.variantId}
          onValueChange={(variantId) => onSelectVariant(productId, variantId)}
        >
          <SelectTrigger
            className={
              fullWidth
                ? 'h-8 w-full max-w-full text-xs'
                : alignEnd
                  ? 'h-8 w-auto min-w-[7rem] max-w-full text-xs'
                  : 'h-8 max-w-full text-xs'
            }
            onPointerDown={stopRowNavigation}
          >
            <SelectValue placeholder={t('list.selectVariant')} />
          </SelectTrigger>
          <SelectContent>
            {meta.lines.map((line) => (
              <SelectItem key={line.variantId} value={line.variantId}>
                {line.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span
          className={
            alignEnd
              ? 'text-right text-xs text-muted-foreground'
              : 'text-xs text-muted-foreground'
          }
        >
          {activeLine.name}
        </span>
      )}
      {showPrice && unitPrice != null ? (
        <PriceDisplay value={unitPrice} size="sm" amountOnly className="text-muted-foreground" />
      ) : null}
      {showStock ? (
        <StockAvailabilityProgress
          size={stockBarSize}
          align={fullWidth ? 'start' : alignEnd ? 'end' : 'start'}
          className={fullWidth ? 'stock-availability-progress-full' : undefined}
          quantity={quantity}
          maxQuantity={maxQuantity}
          minQuantity={minQuantity}
          caption={
            maxQuantity != null && maxQuantity > 0
              ? undefined
              : formatProductListStockAvailability(quantity, t)
          }
        />
      ) : null}
    </div>
  )
}
