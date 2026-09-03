import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import { formatLkr } from '@/shared/utils/formatMoney'

export { formatLkr }

export function formatSaleWhen(iso: string, language?: string): string {
  return formatLocaleDateTime(iso, language)
}

export async function resolveProductUnitPrice(input: {
  listPrice: number | null | undefined
  libraryEntityId: string | null
  loadVariants: (productId: string) => Promise<{ items: Array<{ id: string; isDefault: boolean }> }>
  loadStocks: (
    productId: string,
    variantId: string,
  ) => Promise<{ items: Array<{ sellPrice: number; isActive: boolean }> }>
}): Promise<number | null> {
  if (input.listPrice != null) return input.listPrice
  if (!input.libraryEntityId) return null
  try {
    const variants = await input.loadVariants(input.libraryEntityId)
    const variant = variants.items.find((item) => item.isDefault) ?? variants.items[0]
    if (!variant) return null
    const stocks = await input.loadStocks(input.libraryEntityId, variant.id)
    const active = stocks.items.find((item) => item.isActive) ?? stocks.items[0]
    return active?.sellPrice ?? null
  } catch {
    return null
  }
}
