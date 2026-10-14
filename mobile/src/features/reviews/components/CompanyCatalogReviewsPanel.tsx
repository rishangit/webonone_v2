import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CatalogReviewsDisplayCard,
  type CatalogReviewEntityKind,
  type CatalogReviewListItemData,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { reviewsApi } from '@/shared/services/reviewsApi'
import { overlayReviewerFromSessionUser } from '@/features/reviews/utils/overlayReviewerFromSessionUser'
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
  const { user: sessionUser } = useSession()
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [items, setItems] = useState<CatalogReviewListItemData[]>([])

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
          result.items.map((row) => {
            const reviewer = overlayReviewerFromSessionUser(row, sessionUser)
            return {
              id: reviewer.id,
              rating: reviewer.rating,
              comment: reviewer.comment,
              createdAtLabel: formatDisplayDate(reviewer.createdAt),
              reviewerDisplayName: reviewer.reviewerDisplayName,
              reviewerAvatarUrl: reviewer.reviewerAvatarUrl,
            }
          }),
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
  }, [companyId, entityKind, entityId, sessionUser])

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
      reviewerFallbackLabel={t('reviewerFallbackLabel')}
      overallLabel={
        reviewCount > 0 && averageRating != null
          ? t('displayOverall', { average: averageRating.toFixed(1), count: reviewCount })
          : t('displayNoOverall')
      }
    />
  )
}
