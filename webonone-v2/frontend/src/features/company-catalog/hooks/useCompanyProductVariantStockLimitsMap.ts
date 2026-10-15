import { useCallback, useEffect, useState } from 'react'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'

export type CompanyVariantStockLimits = {
  minQuantity: number | null
  maxQuantity: number | null
}

type StockLimitsListResponse = Awaited<
  ReturnType<typeof companyCatalogApi.listProductVariantStockLimits>
>

const inflightByProductId = new Map<string, Promise<StockLimitsListResponse>>()

function fetchProductVariantStockLimitsList(productId: string): Promise<StockLimitsListResponse> {
  const existing = inflightByProductId.get(productId)
  if (existing) return existing

  const promise = companyCatalogApi.listProductVariantStockLimits(productId).finally(() => {
    inflightByProductId.delete(productId)
  })
  inflightByProductId.set(productId, promise)
  return promise
}

export function invalidateProductVariantStockLimitsList(productId: string): void {
  inflightByProductId.delete(productId.trim())
}

function mapItemsToRecord(
  items: StockLimitsListResponse['items'],
): Record<string, CompanyVariantStockLimits> {
  const record: Record<string, CompanyVariantStockLimits> = {}
  for (const item of items) {
    const limits = { minQuantity: item.minQuantity, maxQuantity: item.maxQuantity }
    record[item.libraryVariantId] = limits
    if (item.companyVariantId) record[item.companyVariantId] = limits
  }
  return record
}

export function useCompanyProductVariantStockLimitsMap(companyProductId: string | undefined): {
  byVariantId: Record<string, CompanyVariantStockLimits>
  loading: boolean
  reload: () => void
} {
  const [byVariantId, setByVariantId] = useState<Record<string, CompanyVariantStockLimits>>({})
  const [loading, setLoading] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    const id = companyProductId?.trim()
    if (id) invalidateProductVariantStockLimitsList(id)
    setReloadToken((token) => token + 1)
  }, [companyProductId])

  useEffect(() => {
    const id = companyProductId?.trim()
    if (!id) {
      setByVariantId({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void fetchProductVariantStockLimitsList(id)
      .then((result) => {
        if (cancelled) return
        setByVariantId(mapItemsToRecord(result.items))
      })
      .catch(() => {
        if (!cancelled) setByVariantId({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [companyProductId, reloadToken])

  return { byVariantId, loading, reload }
}
