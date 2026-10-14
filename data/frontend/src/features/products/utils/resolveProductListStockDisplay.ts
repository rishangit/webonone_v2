import { dataApi } from '@/shared/services/dataApi'
import type { ProductVariantAttributeValue } from '@/shared/types/data.types'

export type ProductListVariantStockLine = {
  variantId: string
  name: string
  quantity: number
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

export async function resolveProductListStockDisplay(
  productId: string,
): Promise<ProductListStockDisplay> {
  const variants = await dataApi.listProductVariants(productId)
  const lines: ProductListVariantStockLine[] = variants.items.map((variant) => ({
    variantId: variant.id,
    name: variant.name,
    quantity: 0,
    totalQuantity: 0,
    costPrice: null,
    sellPrice: null,
    isDefault: variant.isDefault,
    attributeValues: variant.values,
  }))

  const defaultLine = lines.find((line) => line.isDefault)
  return {
    variantCount: variants.items.length,
    defaultQuantity: defaultLine?.quantity ?? null,
    lines,
  }
}
