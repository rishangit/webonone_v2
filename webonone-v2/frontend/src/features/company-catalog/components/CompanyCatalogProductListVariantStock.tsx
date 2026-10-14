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
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import {
  formatCompanyProductListStockAvailability,
  getActiveCompanyProductListLine,
  resolveCompanyProductListUnitPrice,
} from '@/features/company-catalog/utils/companyCatalogProductListStockLine'
import type { ProductPickerStockDisplay } from '@/features/sales/utils/resolveProductPickerStockDisplay'

type CompanyCatalogProductListVariantStockProps = {
  catalogItemId: string
  meta: ProductPickerStockDisplay | undefined
  listPrice?: number | null
  selectedVariantId: string | undefined
  onSelectVariant: (catalogItemId: string, variantId: string) => void
  showPrice?: boolean
  showStock?: boolean
  align?: 'start' | 'end'
  maxQuantity?: number | null
  minQuantity?: number | null
  fullWidth?: boolean
  stockSize?: 'compact' | 'full'
}

function stopRowNavigation(event: SyntheticEvent) {
  event.stopPropagation()
}

export function CompanyCatalogProductListVariantStock({
  catalogItemId,
  meta,
  listPrice,
  selectedVariantId,
  onSelectVariant,
  showPrice = true,
  showStock = true,
  align = 'start',
  maxQuantity: maxQuantityProp,
  minQuantity: minQuantityProp,
  fullWidth = false,
  stockSize = 'compact',
}: CompanyCatalogProductListVariantStockProps) {
  const { t } = useTranslation('catalog')
  const { byVariantId: stockLimitsByVariantId } =
    useCompanyProductVariantStockLimitsMap(catalogItemId)

  const activeLine = getActiveCompanyProductListLine(meta, selectedVariantId)
  if (!meta || !activeLine) return null

  const unitPrice = resolveCompanyProductListUnitPrice(activeLine, listPrice)
  const quantity = activeLine.totalQuantity
  const limits = stockLimitsByVariantId[activeLine.variantId]
  const maxQuantity = maxQuantityProp ?? limits?.maxQuantity
  const minQuantity = minQuantityProp ?? limits?.minQuantity

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
          onValueChange={(variantId) => onSelectVariant(catalogItemId, variantId)}
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
        <PriceDisplay value={unitPrice} size="sm" className="text-muted-foreground" />
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
              : formatCompanyProductListStockAvailability(quantity, t)
          }
        />
      ) : null}
    </div>
  )
}
