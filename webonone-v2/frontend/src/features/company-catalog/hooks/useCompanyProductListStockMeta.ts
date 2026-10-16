import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/store/hooks'
import {
  resolveProductPickerStockDisplay,
  type ProductPickerStockDisplay,
} from '@/features/sales/utils/resolveProductPickerStockDisplay'

export type CompanyProductStockMetaRef = {
  companyProductId: string
  libraryProductId: string
}

export function useCompanyProductListStockMeta(
  products: CompanyProductStockMetaRef[],
): Record<string, ProductPickerStockDisplay> {
  const [stockByProductId, setStockByProductId] = useState<Record<string, ProductPickerStockDisplay>>(
    {},
  )
  const userId = useAppSelector((state) => state.auth.user?.id ?? null)
  const idsKey = products
    .map((product) => `${product.companyProductId}:${product.libraryProductId}`)
    .sort()
    .join(',')

  useEffect(() => {
    const refs = idsKey.length > 0 ? idsKey.split(',').map((pair) => {
      const [companyProductId, libraryProductId] = pair.split(':')
      return { companyProductId: companyProductId ?? '', libraryProductId: libraryProductId ?? '' }
    }).filter((ref) => ref.companyProductId && ref.libraryProductId) : []
    if (refs.length === 0) {
      setStockByProductId({})
      return
    }

    let cancelled = false
    void Promise.all(
      refs.map(async (ref) => {
        const meta = await resolveProductPickerStockDisplay(
          ref.libraryProductId,
          ref.companyProductId,
          userId,
        )
        return { id: ref.companyProductId, meta }
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
  }, [idsKey, userId])

  return stockByProductId
}
