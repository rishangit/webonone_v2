import * as React from 'react'
import { Save } from 'lucide-react'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { ImagePreview } from './ImagePreview'
import { CatalogReviewForm } from './CatalogReviewForm'
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

const FORM_ID = 'catalog-review-dialog-form'

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
  const dialogTitle = title ?? `Review ${target.displayName}`
  const dialogDescription =
    description ?? 'Rate your experience and leave an optional comment.'

  const handleFormSubmit = React.useCallback(
    (payload: CatalogReviewSubmitPayload) => {
      void onSubmit(payload)
    },
    [onSubmit],
  )

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      sizeWidth="small"
      sizeHeight="auto"
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="default"
            className="h-10"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {target.imageUrl ? (
          <ImagePreview
            src={target.imageUrl}
            alt={target.displayName}
            className="h-20 w-20 rounded-md"
          />
        ) : null}
        <CatalogReviewForm
          formId={FORM_ID}
          initialRating={existingReview?.rating ?? null}
          initialComment={existingReview?.comment}
          disabled={saving}
          ratingLabel={ratingLabel}
          commentLabel={commentLabel}
          commentPlaceholder={commentPlaceholder}
          onSubmit={handleFormSubmit}
        />
      </div>
    </CustomDialog>
  )
}

export type {
  CatalogReviewEntityKind,
  CatalogReviewExisting,
  CatalogReviewSubmitPayload,
  CatalogReviewTarget,
} from './catalogReviewTypes'
