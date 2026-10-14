import { View } from 'react-native'
import { ImagePreview } from './ImagePreview'
import { ItemListItem, itemListThumbClassName } from './ItemList'
import { Body, Muted, Subheading } from './Typography'
import { StarRatingDisplay } from './StarRatingDisplay'
import type { CatalogReviewListItemData } from './catalogReviewTypes'
import type { StarRatingSize } from './starRatingSizes'

export type CatalogReviewListItemProps = {
  review: CatalogReviewListItemData
  ratingLabel?: string
  starSize?: StarRatingSize
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
    <ItemListItem>
      <ImagePreview
        src={review.reviewerAvatarUrl ?? null}
        alt={reviewerName}
        className={itemListThumbClassName}
      />
      <View className="min-w-0 flex-1 gap-2">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="min-w-0 flex-1 gap-1">
            <Subheading className="text-sm font-semibold">{reviewerName}</Subheading>
            <StarRatingDisplay value={review.rating} size={starSize} label={ratingLabel} />
          </View>
          {review.createdAtLabel ? (
            <Muted className="shrink-0 text-xs">{review.createdAtLabel}</Muted>
          ) : null}
        </View>
        {review.comment ? (
          <Body className="whitespace-pre-wrap text-sm">{review.comment}</Body>
        ) : (
          <Muted>—</Muted>
        )}
      </View>
    </ItemListItem>
  )
}
