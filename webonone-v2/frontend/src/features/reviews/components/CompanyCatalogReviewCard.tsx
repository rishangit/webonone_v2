import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CatalogOwnReviewCard,
  CatalogReviewDialog,
  useToast,
  type CatalogReviewEntityKind,
  type CatalogReviewListItemData,
  type CatalogReviewSubmitPayload,
} from '@webonone/ui-kit'
import { DISPLAY_DATE_OPTIONS, getIntlLocaleTag } from '@webonone/i18n'
import { useAppSelector } from '@/app/store/hooks'
import { reviewsApi, type CatalogReviewDto } from '@/features/reviews/services/reviewsApi'

export type CompanyCatalogReviewCardProps = {
  companyId: string
  entityKind: CatalogReviewEntityKind
  entityId: string
  displayName: string
  imageUrl?: string | null
  autoPromptWhenEligible?: boolean
  sessionEligible?: boolean
  sourceEventId?: string | null
  sourceOccurrenceDate?: string | null
  /** When false, hide write UI unless the user already has a review. */
  allowSubmit?: boolean
  /** When true, new reviews require {@link sessionEligible} (completed session attendance). */
  attendanceGated?: boolean
  /** Open the review dialog once after load (e.g. email / notification deep link). */
  autoOpenDialog?: boolean
}

function toListItem(
  review: CatalogReviewDto,
  locale: string,
  reviewerName: string,
): CatalogReviewListItemData {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAtLabel: new Date(review.createdAt).toLocaleDateString(locale, DISPLAY_DATE_OPTIONS),
    reviewerDisplayName: reviewerName,
  }
}

export function CompanyCatalogReviewCard({
  companyId,
  entityKind,
  entityId,
  displayName,
  imageUrl,
  autoPromptWhenEligible = false,
  sessionEligible = false,
  sourceEventId,
  sourceOccurrenceDate,
  allowSubmit = true,
  attendanceGated = false,
  autoOpenDialog = false,
}: CompanyCatalogReviewCardProps) {
  const { t, i18n } = useTranslation('reviews')
  const sessionUser = useAppSelector((s) => s.auth.user)
  const { toast } = useToast()
  const [review, setReview] = useState<CatalogReviewDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const autoPromptedRef = useRef(false)

  const loadReview = useCallback(async () => {
    setLoading(true)
    try {
      const result = await reviewsApi.getMyReview({ companyId, entityKind, entityId })
      setReview(result.review)
    } catch {
      setReview(null)
    } finally {
      setLoading(false)
    }
  }, [companyId, entityKind, entityId])

  useEffect(() => {
    void loadReview()
  }, [loadReview])

  useEffect(() => {
    if (
      autoPromptWhenEligible &&
      sessionEligible &&
      !loading &&
      !review &&
      !autoPromptedRef.current
    ) {
      autoPromptedRef.current = true
      setDialogOpen(true)
    }
  }, [autoPromptWhenEligible, sessionEligible, loading, review])

  const canSubmitNew = allowSubmit && (!attendanceGated || sessionEligible)
  const showCard = allowSubmit || review != null || loading

  useEffect(() => {
    if (autoOpenDialog && !loading && (canSubmitNew || review)) {
      setDialogOpen(true)
    }
  }, [autoOpenDialog, loading, review, canSubmitNew])

  async function handleSubmit(payload: CatalogReviewSubmitPayload) {
    setSaving(true)
    try {
      if (review) {
        const updated = await reviewsApi.updateReview(review.id, payload)
        setReview(updated)
        toast({ title: t('submitSuccessUpdate') })
      } else {
        const created = await reviewsApi.createReview({
          companyId,
          entityKind,
          entityId,
          rating: payload.rating,
          comment: payload.comment,
          sourceEventId: sourceEventId ?? null,
          sourceOccurrenceDate: sourceOccurrenceDate ?? null,
        })
        setReview(created)
        toast({ title: t('submitSuccess') })
      }
      setDialogOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      const isDuplicate =
        message.toLowerCase().includes('already reviewed') || message.includes('DUPLICATE_REVIEW')
      if (!review && isDuplicate) {
        try {
          const existing = await reviewsApi.getMyReview({ companyId, entityKind, entityId })
          if (existing.review) {
            const updated = await reviewsApi.updateReview(existing.review.id, payload)
            setReview(updated)
            toast({ title: t('submitSuccessUpdate') })
            setDialogOpen(false)
            return
          }
        } catch {
          // fall through to generic error
        }
      }
      toast({
        title: t('submitError'),
        description: message || undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const locale = getIntlLocaleTag(i18n.language)
  const reviewerName = sessionUser?.displayName.trim() || t('yourReviewerName')
  const listItem = useMemo(
    () =>
      review
        ? {
            ...toListItem(review, locale, reviewerName),
            reviewerAvatarUrl: sessionUser?.avatarUrl ?? null,
          }
        : null,
    [locale, review, reviewerName, sessionUser?.avatarUrl],
  )

  if (!showCard) {
    return null
  }

  return (
    <>
      <CatalogOwnReviewCard
        title={t('yourReviewTitle')}
        description={t('yourReviewDescription')}
        loading={loading}
        loadingLabel={t('loading')}
        review={listItem}
        ratingLabel={t('ratingLabel')}
        reviewerFallbackLabel={t('yourReviewerName')}
        writeLabel={t('writeReview')}
        editLabel={t('editReview')}
        onWrite={canSubmitNew ? () => setDialogOpen(true) : undefined}
        onEdit={review ? () => setDialogOpen(true) : undefined}
      />

      <CatalogReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        target={{
          companyId,
          entityKind,
          entityId,
          displayName,
          imageUrl,
        }}
        existingReview={review}
        saving={saving}
        onSubmit={handleSubmit}
        title={t('dialogTitle', { name: displayName })}
        description={t('dialogDescription')}
        submitLabel={review ? t('saveReview') : t('submitReview')}
        cancelLabel={t('cancel')}
        ratingLabel={t('ratingLabel')}
        commentLabel={t('commentLabel')}
        commentPlaceholder={t('commentPlaceholder')}
      />
    </>
  )
}
