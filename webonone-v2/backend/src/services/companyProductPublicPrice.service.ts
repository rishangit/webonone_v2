import { getActiveSellPricesByLibraryProduct } from './companyProductStock.service.js'

type PriceTarget = {
  listPrice: number | null
  libraryEntityId: string | null
  companyId: string
}

/** Fill listPrice from this company's active stock sell price when company list price is unset. */
export async function applyLibrarySellPricesWhereMissing(targets: PriceTarget[]): Promise<void> {
  const slots: Array<{ index: number; companyId: string; libraryProductId: string }> = []

  targets.forEach((target, index) => {
    if (target.listPrice != null) return
    const libraryProductId = target.libraryEntityId?.trim()
    if (!libraryProductId || !target.companyId) return
    slots.push({ index, companyId: target.companyId, libraryProductId })
  })

  if (slots.length === 0) return

  const prices = await getActiveSellPricesByLibraryProduct(
    slots.map((slot) => ({ companyId: slot.companyId, libraryProductId: slot.libraryProductId })),
  )
  for (const { index, companyId, libraryProductId } of slots) {
    const sell = prices.get(`${companyId}:${libraryProductId}`)
    if (sell != null && Number.isFinite(sell)) {
      targets[index].listPrice = sell
    }
  }
}
