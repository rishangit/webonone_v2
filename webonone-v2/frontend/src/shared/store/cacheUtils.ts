export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000

export function isFresh(lastFetchedAt: number | null, ttl = DEFAULT_CACHE_TTL_MS): boolean {
  if (lastFetchedAt === null) return false
  return Date.now() - lastFetchedAt < ttl
}
