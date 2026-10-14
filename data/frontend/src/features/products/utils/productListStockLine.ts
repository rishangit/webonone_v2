import type { ProductListStockDisplay, ProductListVariantStockLine } from './resolveProductListStockDisplay'

export function getActiveProductListLine(
  meta: ProductListStockDisplay | undefined,
  selectedVariantId?: string,
): ProductListVariantStockLine | null {
  if (!meta || meta.lines.length === 0) return null
  const defaultLine = meta.lines.find((line) => line.isDefault) ?? meta.lines[0]
  if (!defaultLine) return null
  return meta.lines.find((line) => line.variantId === selectedVariantId) ?? defaultLine
}

export function resolveProductListUnitPrice(
  line: ProductListVariantStockLine | null,
  listPrice?: number | null,
): number | null {
  if (!line || line.totalQuantity <= 0) return null
  if (listPrice != null) return listPrice
  if (line.sellPrice == null) return null
  return line.sellPrice
}

export function formatProductListStockAvailability(
  quantity: number,
  translate: (key: 'list.stockAvailable' | 'list.stockOut', options?: { quantity: number }) => string,
): string {
  return quantity > 0
    ? translate('list.stockAvailable', { quantity })
    : translate('list.stockOut')
}
