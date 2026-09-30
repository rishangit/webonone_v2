import { useRef } from 'react'
import { View } from 'react-native'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { ImagePreview } from './ImagePreview'
import { CatalogReviewForm, type CatalogReviewFormHandle } from './CatalogReviewForm'
import type {
  CatalogReviewExisting,
  CatalogReviewSubmitPayload,
  CatalogReviewTarget,
} from './catalogReviewTypes'

export type CatalogReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: CatalogReviewTarget
  existingReview?: CatalogReviewExisting | null
  saving?: boolean
  onSubmit: (payload: CatalogReviewSubmitPayload) => void | Promise<void>
  title?: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
  ratingLabel?: string
  commentLabel?: string
  commentPlaceholder?: string
}

export function CatalogReviewDialog({
  open,
  onOpenChange,
  target,
  existingReview = null,
  saving = false,
  onSubmit,
  title,
  description,
  submitLabel = 'Submit review',
  cancelLabel = 'Cancel',
  ratingLabel,
  commentLabel,
  commentPlaceholder,
}: CatalogReviewDialogProps) {
  const formRef = useRef<CatalogReviewFormHandle>(null)
  const dialogTitle = title ?? `Review ${target.displayName}`
  const dialogDescription =
    description ?? 'Rate your experience and leave an optional comment.'

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      sizeWidth="small"
      sizeHeight="auto"
      footer={
        <View className="flex-row flex-wrap items-center justify-end gap-2">
          <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button disabled={saving} onPress={() => formRef.current?.submit()}>
            {submitLabel}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        {target.imageUrl ? (
          <ImagePreview src={target.imageUrl} alt={target.displayName} className="h-20 w-20 rounded-md" />
        ) : null}
        <CatalogReviewForm
          ref={formRef}
          initialRating={existingReview?.rating ?? null}
          initialComment={existingReview?.comment}
          disabled={saving}
          ratingLabel={ratingLabel}
          commentLabel={commentLabel}
          commentPlaceholder={commentPlaceholder}
          onSubmit={(payload) => void onSubmit(payload)}
        />
      </View>
    </CustomDialog>
  )
}

export type {
  CatalogReviewEntityKind,
  CatalogReviewExisting,
  CatalogReviewSubmitPayload,
  CatalogReviewTarget,
} from './catalogReviewTypes'
