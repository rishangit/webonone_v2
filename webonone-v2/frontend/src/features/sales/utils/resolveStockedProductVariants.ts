import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  dataLibraryApi,
  type LibraryProductVariant,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'
import {
  applyDiscountPercent,
  resolveApplicableVariantDiscount,
} from '@/features/company-catalog/utils/resolveApplicableCatalogPrice'

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
  companyProductId: string,
  userId?: string | null,
): Promise<StockedProductVariantOption[]> {
  const [variants, discounts] = await Promise.all([
    dataLibraryApi.listProductVariants(libraryProductId),
    companyCatalogApi.listDiscounts('products', companyProductId).catch(() => ({ items: [] })),
  ])
  const options: StockedProductVariantOption[] = []

  for (const variant of variants.items) {
    const stocks = await companyCatalogApi.listProductVariantStocks(companyProductId, variant.id)
    const active = pickActiveStock(stocks.items)
    if (active && active.quantity > 0) {
      const discount = resolveApplicableVariantDiscount(discounts.items, variant.id, userId)
      const stock = discount
        ? { ...active, sellPrice: applyDiscountPercent(active.sellPrice, discount.percent) }
        : active
      options.push({ variant, stock })
    }
  }

  return options
}

export function resolveStockedVariantUnitPrice(
  listPrice: number | null | undefined,
  stock: LibraryProductVariantStock,
): number {
  if (Number.isFinite(stock.sellPrice)) return stock.sellPrice
  if (listPrice != null) return listPrice
  return stock.sellPrice
}
