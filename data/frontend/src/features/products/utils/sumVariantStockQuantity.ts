/** Total on-hand quantity across all stock batches for one variant. */
export function sumVariantStockQuantity(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
