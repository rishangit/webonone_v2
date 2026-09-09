export function upsertCatalogListItem<T>(
  items: T[],
  saved: T,
): { items: T[]; totalDelta: number } {
  const savedId =
    saved && typeof saved === 'object' && 'id' in saved ? String((saved as { id: unknown }).id) : ''
  if (!savedId) return { items, totalDelta: 0 }

  const index = items.findIndex(
    (item) =>
      item && typeof item === 'object' && 'id' in item && String((item as { id: unknown }).id) === savedId,
  )
  if (index === -1) {
    return { items: [saved, ...items], totalDelta: 1 }
  }

  const next = [...items]
  next[index] = saved
  return { items: next, totalDelta: 0 }
}

export function mergeAppendedItems<T>(existing: T[], incoming: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  function push(item: T) {
    const id =
      item && typeof item === 'object' && 'id' in item ? String((item as { id: unknown }).id) : ''
    if (id) {
      if (seen.has(id)) return
      seen.add(id)
    }
    result.push(item)
  }

  existing.forEach(push)
  incoming.forEach(push)
  return result
}
