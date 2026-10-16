import type {
  ProductPickerStockDisplay,
  ProductPickerVariantStockLine,
} from '@/features/sales/utils/resolveProductPickerStockDisplay'

export function getActiveCompanyProductListLine(
  meta: ProductPickerStockDisplay | undefined,
  selectedVariantId?: string,
): ProductPickerVariantStockLine | null {
  if (!meta || meta.lines.length === 0) return null
  const defaultLine = meta.lines.find((line) => line.isDefault) ?? meta.lines[0]
  if (!defaultLine) return null
  return meta.lines.find((line) => line.variantId === selectedVariantId) ?? defaultLine
}

export function resolveCompanyProductListUnitPrice(
  line: ProductPickerVariantStockLine | null,
  listPrice?: number | null,
): number | null {
  if (!line || line.totalQuantity <= 0) return null
  if (line.sellPrice != null) return line.sellPrice
  if (listPrice != null) return listPrice
  return null
}

export function companyProductListPriceDisplay(
  line: ProductPickerVariantStockLine | null,
  listPrice?: number | null,
): { value: number; compareAt: number | null; discountPercent: number | null } | null {
  const value = resolveCompanyProductListUnitPrice(line, listPrice)
  if (value == null) return null
  if (line?.sellPrice != null) {
    return {
      value,
      compareAt: line.compareAtSellPrice,
      discountPercent: line.discountPercent,
    }
  }
  return { value, compareAt: null, discountPercent: null }
}

export function formatCompanyProductListStockAvailability(
  quantity: number,
  translate: (key: 'list.stockAvailable' | 'list.stockOut', options?: { quantity: number }) => string,
): string {
  return quantity > 0
    ? translate('list.stockAvailable', { quantity })
    : translate('list.stockOut')
}
