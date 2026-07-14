export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000

export function isFresh(lastFetchedAt: number | null, ttl = DEFAULT_CACHE_TTL_MS): boolean {
  if (lastFetchedAt === null) return false
  return Date.now() - lastFetchedAt < ttl
}

export function serializeQuery(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = params[key]
      if (value !== undefined && value !== '' && value !== 'all') {
        acc[key] = value
      }
      return acc
    }, {})
  return JSON.stringify(sorted)
}
