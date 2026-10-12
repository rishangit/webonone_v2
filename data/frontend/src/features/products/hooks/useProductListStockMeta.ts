import { useEffect, useState } from 'react'
import {
  resolveProductListStockDisplay,
  type ProductListStockDisplay,
} from '@/features/products/utils/resolveProductListStockDisplay'

export function useProductListStockMeta(
  productIds: string[],
  includeCompanyStock = true,
): Record<string, ProductListStockDisplay> {
  const [stockByProductId, setStockByProductId] = useState<Record<string, ProductListStockDisplay>>({})
  const idsKey = productIds.slice().sort().join(',')

  useEffect(() => {
    const ids = idsKey.length > 0 ? idsKey.split(',') : []
    if (ids.length === 0) {
      setStockByProductId({})
      return
    }

    let cancelled = false
    void Promise.all(
      ids.map(async (id) => {
        const meta = await resolveProductListStockDisplay(id, { includeCompanyStock })
        return { id, meta }
      }),
    )
      .then((entries) => {
        if (cancelled) return
        setStockByProductId(Object.fromEntries(entries.map((entry) => [entry.id, entry.meta])))
      })
      .catch(() => {
        if (!cancelled) setStockByProductId({})
      })

    return () => {
      cancelled = true
    }
  }, [idsKey, includeCompanyStock])

  return stockByProductId
}
