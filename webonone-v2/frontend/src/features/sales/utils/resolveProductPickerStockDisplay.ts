import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'

export type ProductPickerVariantStockLine = {
  variantId: string
  name: string
  quantity: number
  isDefault: boolean
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
      isDefault: variant.isDefault,
    })
  }

  const defaultLine = lines.find((line) => line.isDefault)
  return {
    variantCount: variants.items.length,
    defaultQuantity: defaultLine?.quantity ?? null,
    lines,
  }
}
