import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CatalogReviewsDisplayCard } from '@webonone/ui-kit'
import { DISPLAY_DATE_OPTIONS, getIntlLocaleTag } from '@webonone/i18n'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { CatalogKind } from '@/features/catalog/types/catalog.types'

export type CatalogPublicReviewsPanelProps = {
  kind: CatalogKind
  itemId: string
  companyId: string
}

export function CatalogPublicReviewsPanel({ kind, itemId, companyId }: CatalogPublicReviewsPanelProps) {
  const { t, i18n } = useTranslation('search')
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [items, setItems] = useState<
    { id: string; rating: number; comment: string | null; createdAtLabel?: string }[]
  >([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void catalogApi
      .listReviews(kind, itemId, companyId, { page: 1, pageSize: 24 })
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
  }, [kind, itemId, companyId, i18n.language])

  return (
    <CatalogReviewsDisplayCard
      loading={loading}
      averageRating={averageRating}
      reviewCount={reviewCount}
      items={items}
      title={t('reviewsTitle')}
      description={t('reviewsDescription')}
      emptyLabel={t('reviewsEmpty')}
      loadingLabel={t('reviewsLoading')}
      ratingLabel={t('reviewsRatingLabel')}
      overallLabel={
        reviewCount > 0 && averageRating != null
          ? t('reviewsOverall', { average: averageRating.toFixed(1), count: reviewCount })
          : t('reviewsNoOverall')
      }
    />
  )
}
