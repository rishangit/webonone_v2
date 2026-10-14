import { ImagePreview } from './ImagePreview'
import { ItemListContent, ItemListItem, itemListThumbClassName } from './ItemList'
import { StarRatingDisplay } from './StarRatingDisplay'
import type { CatalogReviewListItemData } from './catalogReviewTypes'
import type { StarRatingSize } from './starRatingSizes'

export type CatalogReviewListItemProps = {
  review: CatalogReviewListItemData
  ratingLabel?: string
  starSize?: StarRatingSize
  /** Shown when `reviewerDisplayName` is missing (e.g. anonymous public review). */
  reviewerFallbackLabel?: string
}

export function CatalogReviewListItem({
  review,
  ratingLabel = 'Rating',
  starSize = 'md',
  reviewerFallbackLabel = 'Customer',
}: CatalogReviewListItemProps) {
  const reviewerName = review.reviewerDisplayName?.trim() || reviewerFallbackLabel

  return (
    <ItemListItem className="items-stretch gap-3">
      <ImagePreview
        src={review.reviewerAvatarUrl ?? null}
        alt={reviewerName}
        mode="view"
        className={itemListThumbClassName}
      />
      <ItemListContent className="min-w-0 flex-1 gap-2">
        <div className="flex w-full flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{reviewerName}</p>
            <StarRatingDisplay value={review.rating} size={starSize} label={ratingLabel} />
          </div>
          {review.createdAtLabel ? (
            <span className="shrink-0 text-xs text-muted-foreground">{review.createdAtLabel}</span>
          ) : null}
        </div>
        {review.comment ? (
          <p className="whitespace-pre-wrap text-sm text-foreground">{review.comment}</p>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </ItemListContent>
    </ItemListItem>
  )
}
