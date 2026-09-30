import * as React from 'react'
import { z } from 'zod'
import { FormField } from './Form'
import { Textarea } from './Textarea'
import { mapZodIssuesToFieldErrors } from '../lib/mapZodIssuesToFieldErrors'
import { StarRatingInput } from './StarRatingInput'
import type { CatalogReviewSubmitPayload } from './catalogReviewTypes'

const reviewFormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(5000),
})

export type CatalogReviewFormProps = {
  initialRating?: number | null
  initialComment?: string | null
  disabled?: boolean
  ratingLabel?: string
  commentLabel?: string
  commentPlaceholder?: string
  onSubmit: (payload: CatalogReviewSubmitPayload) => void
  /** When set, parent triggers submit via ref (dialog footer). */
  formId?: string
}

export function CatalogReviewForm({
  initialRating = null,
  initialComment = '',
  disabled = false,
  ratingLabel = 'Your rating',
  commentLabel = 'Comment',
  commentPlaceholder = 'Share your experience (optional)',
  onSubmit,
  formId = 'catalog-review-form',
}: CatalogReviewFormProps) {
  const [rating, setRating] = React.useState<number | null>(initialRating)
  const [comment, setComment] = React.useState(initialComment ?? '')
  const [fieldErrors, setFieldErrors] = React.useState<{
    rating?: string
    comment?: string
  }>({})

  React.useEffect(() => {
    setRating(initialRating)
    setComment(initialComment ?? '')
  }, [initialRating, initialComment])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = reviewFormSchema.safeParse({
      rating: rating ?? 0,
      comment,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    const trimmed = parsed.data.comment.trim()
    onSubmit({
      rating: parsed.data.rating,
      comment: trimmed.length > 0 ? trimmed : null,
    })
  }

  return (
    <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
      <FormField htmlFor="catalog-review-rating" label={ratingLabel} required error={fieldErrors.rating}>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          disabled={disabled}
          id="catalog-review-rating"
          label={ratingLabel}
        />
      </FormField>
      <FormField htmlFor="catalog-review-comment" label={commentLabel} error={fieldErrors.comment}>
        <Textarea
          id="catalog-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={commentPlaceholder}
          disabled={disabled}
          rows={4}
          className="resize-y min-h-[6rem] bg-[hsl(var(--input-background))] border-[hsl(var(--glass-border))]"
        />
      </FormField>
    </form>
  )
}
