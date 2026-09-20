export function formatLkr(value: number, currency = 'LKR'): string {
  return `${currency} ${value.toFixed(2)}`
}

export function formatSaleWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
