import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CatalogReviewDialog,
  StarRatingInput,
  useToast,
  type CatalogReviewEntityKind,
  type CatalogReviewSubmitPayload,
} from '@webonone/ui-kit'
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
  const { t } = useTranslation('reviews')
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

  if (!showCard) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('yourReviewTitle')}</CardTitle>
          <CardDescription>{t('yourReviewDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : review ? (
            <>
              <StarRatingInput
                value={review.rating}
                onChange={() => {}}
                disabled
                label={t('ratingLabel')}
              />
              {review.comment ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{review.comment}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t('noComment')}</p>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                {t('editReview')}
              </Button>
            </>
          ) : canSubmitNew ? (
            <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
              {t('writeReview')}
            </Button>
          ) : null}
        </CardContent>
      </Card>

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
