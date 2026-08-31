import {
  dataLibraryApi,
  type LibraryProductVariant,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'

export type StockedProductVariantOption = {
  variant: LibraryProductVariant
  stock: LibraryProductVariantStock
}

function pickActiveStock(stocks: LibraryProductVariantStock[]): LibraryProductVariantStock | null {
  if (stocks.length === 0) return null
  return stocks.find((item) => item.isActive) ?? stocks[0] ?? null
}

export async function resolveStockedProductVariants(
  libraryProductId: string,
): Promise<StockedProductVariantOption[]> {
  const variants = await dataLibraryApi.listProductVariants(libraryProductId)
  const options: StockedProductVariantOption[] = []

  for (const variant of variants.items) {
    const stocks = await dataLibraryApi.listProductVariantStocks(libraryProductId, variant.id)
    const active = pickActiveStock(stocks.items)
    if (active && active.quantity > 0) {
      options.push({ variant, stock: active })
    }
  }

  return options
}

export function resolveStockedVariantUnitPrice(
  listPrice: number | null | undefined,
  stock: LibraryProductVariantStock,
): number {
  if (listPrice != null) return listPrice
  return stock.sellPrice
}
