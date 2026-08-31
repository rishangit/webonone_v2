import type { CreateSaleLineBody, PosCartLine } from '@/features/sales/types/sales.types'

export function posCartLinesToSaleLines(lines: PosCartLine[]): CreateSaleLineBody[] {
  return lines.map((line) => {
    const body: CreateSaleLineBody = {
      itemKind: line.itemKind,
      catalogItemId: line.catalogItemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    }
    if (line.libraryVariantId && line.libraryStockId) {
      body.libraryVariantId = line.libraryVariantId
      body.libraryStockId = line.libraryStockId
    }
    return body
  })
}

export function findPosCartStockViolation(lines: PosCartLine[]): PosCartLine | null {
  return (
    lines.find(
      (line) =>
        line.libraryStockId != null &&
        line.availableQuantity != null &&
        line.quantity > line.availableQuantity,
    ) ?? null
  )
}
