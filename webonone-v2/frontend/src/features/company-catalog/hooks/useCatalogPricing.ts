import { useCallback, useEffect, useState } from 'react'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type {
  CatalogDiscount,
  CatalogDiscountKind,
  CatalogPrice,
} from '@/features/company-catalog/types/catalogPricing.types'

export function useCatalogPricing(
  kind: CatalogDiscountKind | null,
  entityId: string,
  companyId?: string,
) {
  const [prices, setPrices] = useState<CatalogPrice[]>([])
  const [discounts, setDiscounts] = useState<CatalogDiscount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!kind || !entityId) {
      setPrices([])
      setDiscounts([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const loadPrices = kind === 'services' || kind === 'spaces'
      const [priceResult, discountResult] = await Promise.all([
        loadPrices
          ? companyCatalogApi.listPrices(kind, entityId, companyId)
          : Promise.resolve({ items: [] as CatalogPrice[] }),
        companyCatalogApi.listDiscounts(kind, entityId, companyId),
      ])
      setPrices(priceResult.items)
      setDiscounts(discountResult.items)
    } catch (err) {
      setPrices([])
      setDiscounts([])
      setError(err instanceof Error ? err.message : 'Failed to load prices')
    } finally {
      setLoading(false)
    }
  }, [companyId, entityId, kind])

  useEffect(() => {
    void reload()
  }, [reload])

  return { prices, discounts, loading, error, reload }
}
