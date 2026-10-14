import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { CatalogRatingSummary } from './CatalogRatingSummary'
import { CatalogReviewListItem } from './CatalogReviewListItem'
import type { CatalogReviewListItemData } from './catalogReviewTypes'
import { ItemList, ItemListEmpty } from './ItemList'
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
  /** Star size for overall average and per-review rows */
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : (
          <>
            <CatalogRatingSummary
              averageRating={averageRating}
              reviewCount={reviewCount}
              countLabel={overallText}
              size={starSize}
              ratingLabel={ratingLabel}
              showEmpty
            />
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
