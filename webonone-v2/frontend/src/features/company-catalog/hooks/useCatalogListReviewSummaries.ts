import { useEffect, useMemo, useState } from 'react'
import { reviewsApi, type ReviewSummaryDto } from '@/features/reviews/services/reviewsApi'
import { catalogKindToReviewKind, isReviewableCatalogKind } from '@/features/reviews/utils/catalogReviewKind'
import type { CatalogEntityKind, HydratedCatalogItem } from '../types/companyCatalog.types'

export function useCatalogListReviewSummaries(
  kind: CatalogEntityKind,
  items: HydratedCatalogItem[],
): Record<string, ReviewSummaryDto> {
  const [summaries, setSummaries] = useState<Record<string, ReviewSummaryDto>>({})

  const companyId = items[0]?.companyId
  const entityKind = isReviewableCatalogKind(kind) ? catalogKindToReviewKind(kind) : null
  const entityIdsKey = useMemo(() => items.map((item) => item.id).join(','), [items])

  useEffect(() => {
    if (!companyId || !entityKind || items.length === 0) {
      setSummaries({})
      return
    }

    const entityIds = items.map((item) => item.id)
    void reviewsApi
      .getSummariesBatch({ companyId, entityKind, entityIds })
      .then((result) => setSummaries(result.summaries))
      .catch(() => setSummaries({}))
  }, [companyId, entityKind, entityIdsKey])

  return summaries
}
