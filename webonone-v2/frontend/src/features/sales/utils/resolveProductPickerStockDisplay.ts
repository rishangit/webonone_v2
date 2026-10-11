import {
  dataLibraryApi,
  type LibraryProductVariantAttributeValue,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'

export type ProductPickerVariantStockLine = {
  variantId: string
  name: string
  /** Active batch quantity (list / pricing context). */
  quantity: number
  /** Sum of all batch quantities for this variant. */
  totalQuantity: number
  costPrice: number | null
  sellPrice: number | null
  isDefault: boolean
  attributeValues: LibraryProductVariantAttributeValue[]
}

export type ProductPickerStockDisplay = {
  variantCount: number
  defaultQuantity: number | null
  lines: ProductPickerVariantStockLine[]
}

function pickActiveStock(stocks: LibraryProductVariantStock[]): LibraryProductVariantStock | null {
  if (stocks.length === 0) return null
  return stocks.find((item) => item.isActive) ?? stocks[0] ?? null
}

export async function resolveProductPickerStockDisplay(
  libraryProductId: string,
): Promise<ProductPickerStockDisplay> {
  const variants = await dataLibraryApi.listProductVariants(libraryProductId)
  const lines: ProductPickerVariantStockLine[] = []

  for (const variant of variants.items) {
    const stocks = await dataLibraryApi.listProductVariantStocks(libraryProductId, variant.id)
    const active = pickActiveStock(stocks.items)
    lines.push({
      variantId: variant.id,
      name: variant.name,
      quantity: active?.quantity ?? 0,
      totalQuantity: stocks.items.reduce((sum, item) => sum + item.quantity, 0),
      costPrice: active?.costPrice ?? null,
      sellPrice: active?.sellPrice ?? null,
      isDefault: variant.isDefault,
      attributeValues: variant.values,
    })
  }

  const defaultLine = lines.find((line) => line.isDefault)
  return {
    variantCount: variants.items.length,
    defaultQuantity: defaultLine?.quantity ?? null,
    lines,
  }
}
