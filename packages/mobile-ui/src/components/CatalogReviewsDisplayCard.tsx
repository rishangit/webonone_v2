import { View } from 'react-native'
import { Card } from './Card'
import { ItemList, ItemListEmpty, ItemListItem } from './ItemList'
import { Body, Muted, Subheading } from './Typography'
import { StarRatingInput } from './StarRatingInput'

export type CatalogReviewListItem = {
  id: string
  rating: number
  comment: string | null
  createdAtLabel?: string
}

export type CatalogReviewsDisplayCardProps = {
  averageRating: number | null
  reviewCount: number
  items: CatalogReviewListItem[]
  loading?: boolean
  title?: string
  description?: string
  emptyLabel?: string
  overallLabel?: string
  ratingLabel?: string
  loadingLabel?: string
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
            <StarRatingInput
              value={averageRating != null ? Math.round(averageRating) : null}
              onChange={() => {}}
              disabled
              label={ratingLabel}
            />
            <Subheading className="text-sm">{overallText}</Subheading>
          </View>
          <ItemList>
            {items.length === 0 ? (
              <ItemListEmpty>{emptyLabel}</ItemListEmpty>
            ) : (
              items.map((review) => (
                <ItemListItem key={review.id}>
                  <View className="min-w-0 flex-1 gap-2">
                    <View className="flex-row flex-wrap items-center justify-between gap-2">
                      <StarRatingInput
                        value={review.rating}
                        onChange={() => {}}
                        disabled
                        label={ratingLabel}
                      />
                      {review.createdAtLabel ? (
                        <Muted className="text-xs">{review.createdAtLabel}</Muted>
                      ) : null}
                    </View>
                    {review.comment ? (
                      <Body className="whitespace-pre-wrap text-sm">{review.comment}</Body>
                    ) : (
                      <Muted>—</Muted>
                    )}
                  </View>
                </ItemListItem>
              ))
            )}
          </ItemList>
        </View>
      )}
    </Card>
  )
}
