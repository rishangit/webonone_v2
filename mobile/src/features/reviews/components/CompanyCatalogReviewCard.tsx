import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  CatalogReviewDialog,
  Muted,
  StarRatingInput,
  Subheading,
  useToast,
  type CatalogReviewEntityKind,
  type CatalogReviewSubmitPayload,
} from '@webonone/mobile-ui'
import { reviewsApi, type CatalogReviewDto } from '@/shared/services/reviewsApi'

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
  allowSubmit?: boolean
  attendanceGated?: boolean
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
          // fall through
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
      <Card className="gap-3">
        <Subheading>{t('yourReviewTitle')}</Subheading>
        <Muted>{t('yourReviewDescription')}</Muted>
        {loading ? (
          <Muted>{t('loading')}</Muted>
        ) : review ? (
          <View className="gap-3">
            <StarRatingInput
              value={review.rating}
              onChange={() => {}}
              disabled
              label={t('ratingLabel')}
            />
            {review.comment ? (
              <Body className="text-sm">{review.comment}</Body>
            ) : (
              <Muted>{t('noComment')}</Muted>
            )}
            <Button size="sm" variant="outline" onPress={() => setDialogOpen(true)}>
              {t('editReview')}
            </Button>
          </View>
        ) : canSubmitNew ? (
          <Button size="sm" onPress={() => setDialogOpen(true)}>
            {t('writeReview')}
          </Button>
        ) : null}
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
