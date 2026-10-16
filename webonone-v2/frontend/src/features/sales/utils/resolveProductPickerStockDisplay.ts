import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  dataLibraryApi,
  type LibraryProductVariantAttributeValue,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'
import {
  applyDiscountPercent,
  resolveApplicableVariantDiscount,
} from '@/features/company-catalog/utils/resolveApplicableCatalogPrice'

export type ProductPickerVariantStockLine = {
  variantId: string
  name: string
  /** Active batch quantity (list / pricing context). */
  quantity: number
  /** Sum of all batch quantities for this variant. */
  totalQuantity: number
  costPrice: number | null
  /** Active stock sell price after a matching discount. */
  sellPrice: number | null
  compareAtSellPrice: number | null
  discountPercent: number | null
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
  companyProductId: string,
  userId?: string | null,
): Promise<ProductPickerStockDisplay> {
  const [variants, discounts] = await Promise.all([
    dataLibraryApi.listProductVariants(libraryProductId),
    companyCatalogApi.listDiscounts('products', companyProductId).catch(() => ({ items: [] })),
  ])
  const lines: ProductPickerVariantStockLine[] = []

  for (const variant of variants.items) {
    const stocks = await companyCatalogApi.listProductVariantStocks(companyProductId, variant.id)
    const active = pickActiveStock(stocks.items)
    const base = active?.sellPrice ?? null
    const discount =
      base == null ? null : resolveApplicableVariantDiscount(discounts.items, variant.id, userId)
    lines.push({
      variantId: variant.id,
      name: variant.name,
      quantity: active?.quantity ?? 0,
      totalQuantity: stocks.items.reduce((sum, item) => sum + item.quantity, 0),
      costPrice: active?.costPrice ?? null,
      sellPrice: base != null && discount ? applyDiscountPercent(base, discount.percent) : base,
      compareAtSellPrice: base != null && discount ? base : null,
      discountPercent: discount?.percent ?? null,
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
