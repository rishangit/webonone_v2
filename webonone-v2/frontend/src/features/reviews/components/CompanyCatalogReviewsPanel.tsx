import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CatalogReviewsDisplayCard, type CatalogReviewEntityKind } from '@webonone/ui-kit'
import { DISPLAY_DATE_OPTIONS, getIntlLocaleTag } from '@webonone/i18n'
import { reviewsApi } from '@/features/reviews/services/reviewsApi'

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
  const { t, i18n } = useTranslation('reviews')
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
        const locale = getIntlLocaleTag(i18n.language)
        setItems(
          result.items.map((row) => ({
            id: row.id,
            rating: row.rating,
            comment: row.comment,
            createdAtLabel: new Date(row.createdAt).toLocaleDateString(locale, DISPLAY_DATE_OPTIONS),
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
  }, [companyId, entityKind, entityId, i18n.language])

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
