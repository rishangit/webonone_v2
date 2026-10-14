import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

export function formatSaleWhen(iso: string): string {
  return formatDisplayDateTime(iso)
}

export async function resolveProductUnitPrice(input: {
  listPrice: number | null | undefined
  libraryEntityId: string | null
  loadVariants: (libraryProductId: string) => Promise<{ items: Array<{ id: string; isDefault: boolean }> }>
  loadStocks: (
    variantId: string,
  ) => Promise<{ items: Array<{ sellPrice: number; isActive: boolean }> }>
}): Promise<number | null> {
  if (input.listPrice != null) return input.listPrice
  if (!input.libraryEntityId) return null
  try {
    const variants = await input.loadVariants(input.libraryEntityId)
    const variant = variants.items.find((item) => item.isDefault) ?? variants.items[0]
    if (!variant) return null
    const stocks = await input.loadStocks(variant.id)
    const active = stocks.items.find((item) => item.isActive) ?? stocks.items[0]
    return active?.sellPrice ?? null
  } catch {
    return null
  }
}
