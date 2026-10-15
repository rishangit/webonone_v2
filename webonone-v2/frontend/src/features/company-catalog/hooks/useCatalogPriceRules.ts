import { useCallback, useEffect, useState } from 'react'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type {
  CatalogPriceKind,
  CatalogPriceRule,
} from '@/features/company-catalog/types/catalogPriceRule.types'

export function useCatalogPriceRules(
  kind: CatalogPriceKind | null,
  entityId: string,
  companyId?: string,
) {
  const [rules, setRules] = useState<CatalogPriceRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!kind || !entityId) {
      setRules([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listPriceRules(kind, entityId, companyId)
      setRules(result.items)
    } catch (err) {
      setRules([])
      setError(err instanceof Error ? err.message : 'Failed to load prices')
    } finally {
      setLoading(false)
    }
  }, [companyId, entityId, kind])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rules, loading, error, reload }
}
