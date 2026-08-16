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
