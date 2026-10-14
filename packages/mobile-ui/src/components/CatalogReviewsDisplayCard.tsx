import { View } from 'react-native'
import { CatalogReviewListItem } from './CatalogReviewListItem'
import type { CatalogReviewListItemData } from './catalogReviewTypes'
import { Card } from './Card'
import { ItemList, ItemListEmpty } from './ItemList'
import { Muted, Subheading } from './Typography'
import { StarRatingDisplay } from './StarRatingDisplay'
import type { StarRatingSize } from './starRatingSizes'

export type CatalogReviewsDisplayCardProps = {
  averageRating: number | null
  reviewCount: number
  items: CatalogReviewListItemData[]
  loading?: boolean
  title?: string
  description?: string
  emptyLabel?: string
  overallLabel?: string
  ratingLabel?: string
  loadingLabel?: string
  reviewerFallbackLabel?: string
  starSize?: StarRatingSize
}

function formatOverall(average: number | null, count: number, overallLabel?: string): string {
  if (count === 0) {
    return overallLabel ?? 'No reviews yet'
  }
  const avg = average != null ? average.toFixed(1) : '—'
  return overallLabel ?? `${avg} out of 5 · ${count} review${count === 1 ? '' : 's'}`
}

export function CatalogReviewsDisplayCard({
  averageRating,
  reviewCount,
  items,
  loading = false,
  title = 'Customer reviews',
  description = 'Ratings and comments from customers who used this item.',
  emptyLabel = 'No reviews yet.',
  overallLabel,
  ratingLabel = 'Rating',
  loadingLabel = 'Loading reviews…',
  reviewerFallbackLabel = 'Customer',
  starSize = 'md',
}: CatalogReviewsDisplayCardProps) {
  const overallText = formatOverall(averageRating, reviewCount, overallLabel)

  return (
    <Card className="gap-4 p-4">
      <View className="gap-1">
        <Subheading>{title}</Subheading>
        <Muted>{description}</Muted>
      </View>
      {loading ? (
        <Muted>{loadingLabel}</Muted>
      ) : (
        <View className="gap-4">
          <View className="gap-2">
            <StarRatingDisplay value={averageRating} size={starSize} label={ratingLabel} />
            <Subheading className="text-sm">{overallText}</Subheading>
          </View>
          <ItemList>
            {items.length === 0 ? (
              <ItemListEmpty>{emptyLabel}</ItemListEmpty>
            ) : (
              items.map((review) => (
                <CatalogReviewListItem
                  key={review.id}
                  review={review}
                  ratingLabel={ratingLabel}
                  starSize={starSize}
                  reviewerFallbackLabel={reviewerFallbackLabel}
                />
              ))
            )}
          </ItemList>
        </View>
      )}
    </Card>
  )
}
