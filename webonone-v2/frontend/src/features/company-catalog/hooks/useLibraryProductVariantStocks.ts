import { useCallback, useEffect, useMemo, useState } from 'react'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type { LibraryProductVariantStock } from '@/features/company-catalog/services/dataLibraryApi'

type StocksCacheEntry = {
  items: LibraryProductVariantStock[]
  loading: boolean
  error: string | null
}

const cacheByKey = new Map<string, StocksCacheEntry>()
const inflightByKey = new Map<string, Promise<LibraryProductVariantStock[]>>()

function cacheKey(companyProductId: string, variantId: string): string {
  return `${companyProductId}:${variantId}`
}

function getOrCreateEntry(key: string): StocksCacheEntry {
  const existing = cacheByKey.get(key)
  if (existing) return existing
  const entry: StocksCacheEntry = { items: [], loading: true, error: null }
  cacheByKey.set(key, entry)
  return entry
}

function fetchStocks(companyProductId: string, variantId: string): Promise<LibraryProductVariantStock[]> {
  const key = cacheKey(companyProductId, variantId)
  const inflight = inflightByKey.get(key)
  if (inflight) return inflight

  const entry = getOrCreateEntry(key)
  entry.loading = true
  entry.error = null

  const promise = companyCatalogApi
    .listProductVariantStocks(companyProductId, variantId)
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
  companyProductId: string,
  variantId: string,
): void {
  cacheByKey.delete(cacheKey(companyProductId, variantId))
  inflightByKey.delete(cacheKey(companyProductId, variantId))
}

export function useLibraryProductVariantStocks(
  companyProductId: string | undefined,
  variantId: string | undefined,
) {
  const [reloadToken, setReloadToken] = useState(0)
  const [snapshot, setSnapshot] = useState<StocksCacheEntry>(() => ({
    items: [],
    loading: false,
    error: null,
  }))

  const productId = companyProductId?.trim() ?? ''
  const variant = variantId?.trim() ?? ''
  const key = productId && variant ? cacheKey(productId, variant) : ''

  const reload = useCallback(() => {
    if (productId && variant) {
      invalidateLibraryProductVariantStocks(productId, variant)
    }
    setReloadToken((token) => token + 1)
  }, [productId, variant])

  useEffect(() => {
    if (!productId || !variant) {
      setSnapshot({ items: [], loading: false, error: null })
      return
    }

    const entry = getOrCreateEntry(key)
    setSnapshot({ ...entry })

    let cancelled = false
    void fetchStocks(productId, variant)
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
  }, [key, productId, variant, reloadToken])

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
