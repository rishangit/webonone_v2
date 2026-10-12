import { sumVariantStockQuantity } from '@/features/products/utils/sumVariantStockQuantity'
import { dataApi } from '@/shared/services/dataApi'
import type { ProductVariantAttributeValue, ProductVariantStock } from '@/shared/types/data.types'

export type ProductListVariantStockLine = {
  variantId: string
  name: string
  /** Active batch quantity (catalog list / sell price context). */
  quantity: number
  /** Sum of all batch quantities for this variant. */
  totalQuantity: number
  costPrice: number | null
  sellPrice: number | null
  isDefault: boolean
  attributeValues: ProductVariantAttributeValue[]
}

export type ProductListStockDisplay = {
  variantCount: number
  defaultQuantity: number | null
  lines: ProductListVariantStockLine[]
}

function pickActiveStock(stocks: ProductVariantStock[]): ProductVariantStock | null {
  if (stocks.length === 0) return null
  return stocks.find((item) => item.isActive) ?? stocks[0] ?? null
}

export type ResolveProductListStockDisplayOptions = {
  /** When false, variants are listed without fetching company stock batches (super-admin library view). */
  includeCompanyStock?: boolean
}

export async function resolveProductListStockDisplay(
  productId: string,
  options?: ResolveProductListStockDisplayOptions,
): Promise<ProductListStockDisplay> {
  const includeCompanyStock = options?.includeCompanyStock ?? true
  const variants = await dataApi.listProductVariants(productId)
  const lines: ProductListVariantStockLine[] = []

  for (const variant of variants.items) {
    if (!includeCompanyStock) {
      lines.push({
        variantId: variant.id,
        name: variant.name,
        quantity: 0,
        totalQuantity: 0,
        costPrice: null,
        sellPrice: null,
        isDefault: variant.isDefault,
        attributeValues: variant.values,
      })
      continue
    }

    const stocks = await dataApi.listProductVariantStocks(productId, variant.id)
    const active = pickActiveStock(stocks.items)
    lines.push({
      variantId: variant.id,
      name: variant.name,
      quantity: active?.quantity ?? 0,
      totalQuantity: sumVariantStockQuantity(stocks.items),
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
