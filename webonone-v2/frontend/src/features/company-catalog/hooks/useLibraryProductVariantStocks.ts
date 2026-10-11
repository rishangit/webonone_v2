import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'

type StocksCacheEntry = {
  items: LibraryProductVariantStock[]
  loading: boolean
  error: string | null
}

const cacheByKey = new Map<string, StocksCacheEntry>()
const inflightByKey = new Map<string, Promise<LibraryProductVariantStock[]>>()

function cacheKey(libraryProductId: string, variantId: string): string {
  return `${libraryProductId}:${variantId}`
}

function getOrCreateEntry(key: string): StocksCacheEntry {
  const existing = cacheByKey.get(key)
  if (existing) return existing
  const entry: StocksCacheEntry = { items: [], loading: true, error: null }
  cacheByKey.set(key, entry)
  return entry
}

function fetchStocks(libraryProductId: string, variantId: string): Promise<LibraryProductVariantStock[]> {
  const key = cacheKey(libraryProductId, variantId)
  const inflight = inflightByKey.get(key)
  if (inflight) return inflight

  const entry = getOrCreateEntry(key)
  entry.loading = true
  entry.error = null

  const promise = dataLibraryApi
    .listProductVariantStocks(libraryProductId, variantId)
    .then((result) => {
      entry.items = result.items
      entry.loading = false
      return result.items
    })
    .catch((err) => {
      entry.items = []
      entry.loading = false
      entry.error = err instanceof Error ? err.message : 'Failed to load stocks'
      throw err
    })
    .finally(() => {
      inflightByKey.delete(key)
    })

  inflightByKey.set(key, promise)
  return promise
}

export function invalidateLibraryProductVariantStocks(
  libraryProductId: string,
  variantId: string,
): void {
  cacheByKey.delete(cacheKey(libraryProductId, variantId))
  inflightByKey.delete(cacheKey(libraryProductId, variantId))
}

export function useLibraryProductVariantStocks(
  libraryProductId: string | undefined,
  variantId: string | undefined,
) {
  const [reloadToken, setReloadToken] = useState(0)
  const [snapshot, setSnapshot] = useState<StocksCacheEntry>(() => ({
    items: [],
    loading: false,
    error: null,
  }))

  const libraryId = libraryProductId?.trim() ?? ''
  const variant = variantId?.trim() ?? ''
  const key = libraryId && variant ? cacheKey(libraryId, variant) : ''

  const reload = useCallback(() => {
    if (libraryId && variant) {
      invalidateLibraryProductVariantStocks(libraryId, variant)
    }
    setReloadToken((token) => token + 1)
  }, [libraryId, variant])

  useEffect(() => {
    if (!libraryId || !variant) {
      setSnapshot({ items: [], loading: false, error: null })
      return
    }

    const entry = getOrCreateEntry(key)
    setSnapshot({ ...entry })

    let cancelled = false
    void fetchStocks(libraryId, variant)
      .then(() => {
        if (cancelled) return
        const latest = getOrCreateEntry(key)
        setSnapshot({ ...latest })
      })
      .catch(() => {
        if (cancelled) return
        const latest = getOrCreateEntry(key)
        setSnapshot({ ...latest })
      })

    return () => {
      cancelled = true
    }
  }, [key, libraryId, variant, reloadToken])

  const totalQuantity = useMemo(
    () => snapshot.items.reduce((sum, item) => sum + item.quantity, 0),
    [snapshot.items],
  )

  return {
    items: snapshot.items,
    loading: snapshot.loading,
    error: snapshot.error,
    totalQuantity,
    reload,
  }
}
