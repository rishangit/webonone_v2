import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CatalogReviewsDisplayCard, type CatalogReviewEntityKind } from '@webonone/mobile-ui'
import { reviewsApi } from '@/shared/services/reviewsApi'
import { formatDisplayDate } from '@/shared/utils/formatDisplayDate'

export type CompanyCatalogReviewsPanelProps = {
  companyId: string
  entityKind: CatalogReviewEntityKind
  entityId: string
}

export function CompanyCatalogReviewsPanel({
  companyId,
  entityKind,
  entityId,
}: CompanyCatalogReviewsPanelProps) {
  const { t } = useTranslation('reviews')
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [items, setItems] = useState<
    { id: string; rating: number; comment: string | null; createdAtLabel?: string }[]
  >([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void reviewsApi
      .listPublic({ companyId, entityKind, entityId, page: 1, pageSize: 24 })
      .then((result) => {
        if (cancelled) return
        setAverageRating(result.summary.averageRating)
        setReviewCount(result.summary.count)
        setItems(
          result.items.map((row) => ({
            id: row.id,
            rating: row.rating,
            comment: row.comment,
            createdAtLabel: formatDisplayDate(row.createdAt),
          })),
        )
      })
      .catch(() => {
        if (cancelled) return
        setAverageRating(null)
        setReviewCount(0)
        setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [companyId, entityKind, entityId])

  return (
    <CatalogReviewsDisplayCard
      loading={loading}
      averageRating={averageRating}
      reviewCount={reviewCount}
      items={items}
      title={t('displayTitle')}
      description={t('displayDescription')}
      emptyLabel={t('displayEmpty')}
      loadingLabel={t('displayLoading')}
      ratingLabel={t('ratingLabel')}
      overallLabel={
        reviewCount > 0 && averageRating != null
          ? t('displayOverall', { average: averageRating.toFixed(1), count: reviewCount })
          : t('displayNoOverall')
      }
    />
  )
}
