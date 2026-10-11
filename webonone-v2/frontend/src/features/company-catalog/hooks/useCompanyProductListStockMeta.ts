import { useEffect, useState } from 'react'
import {
  resolveProductPickerStockDisplay,
  type ProductPickerStockDisplay,
} from '@/features/sales/utils/resolveProductPickerStockDisplay'

export function useCompanyProductListStockMeta(
  libraryProductIds: string[],
): Record<string, ProductPickerStockDisplay> {
  const [stockByLibraryId, setStockByLibraryId] = useState<Record<string, ProductPickerStockDisplay>>({})
  const idsKey = libraryProductIds.slice().sort().join(',')

  useEffect(() => {
    const ids = idsKey.length > 0 ? idsKey.split(',') : []
    if (ids.length === 0) {
      setStockByLibraryId({})
      return
    }

    let cancelled = false
    void Promise.all(
      ids.map(async (id) => {
        const meta = await resolveProductPickerStockDisplay(id)
        return { id, meta }
      }),
    )
      .then((entries) => {
        if (cancelled) return
        setStockByLibraryId(Object.fromEntries(entries.map((entry) => [entry.id, entry.meta])))
      })
      .catch(() => {
        if (!cancelled) setStockByLibraryId({})
      })

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return stockByLibraryId
}
