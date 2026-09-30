import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { View } from 'react-native'
import { z } from 'zod'
import { FormField } from './FormField'
import { Textarea } from './Textarea'
import { StarRatingInput } from './StarRatingInput'
import type { CatalogReviewSubmitPayload } from './catalogReviewTypes'

const reviewFormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(5000),
})

export type CatalogReviewFormHandle = {
  submit: () => void
}

export type CatalogReviewFormProps = {
  initialRating?: number | null
  initialComment?: string | null
  disabled?: boolean
  ratingLabel?: string
  commentLabel?: string
  commentPlaceholder?: string
  onSubmit: (payload: CatalogReviewSubmitPayload) => void
}

export const CatalogReviewForm = forwardRef<CatalogReviewFormHandle, CatalogReviewFormProps>(
  function CatalogReviewForm(
    {
      initialRating = null,
      initialComment = '',
      disabled = false,
      ratingLabel = 'Your rating',
      commentLabel = 'Comment',
      commentPlaceholder = 'Share your experience (optional)',
      onSubmit,
    },
    ref,
  ) {
    const [rating, setRating] = useState<number | null>(initialRating)
    const [comment, setComment] = useState(initialComment ?? '')
    const [ratingError, setRatingError] = useState<string | undefined>()
    const [commentError, setCommentError] = useState<string | undefined>()

    useEffect(() => {
      setRating(initialRating)
      setComment(initialComment ?? '')
    }, [initialRating, initialComment])

    function submitForm() {
      const parsed = reviewFormSchema.safeParse({
        rating: rating ?? 0,
        comment,
      })
      if (!parsed.success) {
        const issues = parsed.error.issues
        setRatingError(issues.find((i) => i.path[0] === 'rating')?.message)
        setCommentError(issues.find((i) => i.path[0] === 'comment')?.message)
        return
      }
      setRatingError(undefined)
      setCommentError(undefined)
      const trimmed = parsed.data.comment.trim()
      onSubmit({
        rating: parsed.data.rating,
        comment: trimmed.length > 0 ? trimmed : null,
      })
    }

    useImperativeHandle(ref, () => ({ submit: submitForm }), [rating, comment, onSubmit])

    return (
      <View className="gap-4">
        <FormField label={ratingLabel} required error={ratingError}>
          <StarRatingInput
            value={rating}
            onChange={setRating}
            disabled={disabled}
            label={ratingLabel}
          />
        </FormField>
        <FormField label={commentLabel} error={commentError}>
          <Textarea
            value={comment}
            onChangeText={setComment}
            placeholder={commentPlaceholder}
            editable={!disabled}
            numberOfLines={4}
          />
        </FormField>
      </View>
    )
  },
)
