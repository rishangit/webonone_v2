import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { ItemList, ItemListContent, ItemListEmpty, ItemListItem } from './ItemList'
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <StarRatingInput
                value={averageRating != null ? Math.round(averageRating) : null}
                onChange={() => {}}
                disabled
                label={ratingLabel}
              />
              <p className="text-sm font-medium text-foreground">{overallText}</p>
            </div>
            <ItemList>
              {items.length === 0 ? (
                <ItemListEmpty>{emptyLabel}</ItemListEmpty>
              ) : (
                items.map((review) => (
                  <ItemListItem key={review.id} className="flex-col items-stretch gap-2">
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      <StarRatingInput
                        value={review.rating}
                        onChange={() => {}}
                        disabled
                        label={ratingLabel}
                        className="pointer-events-none"
                      />
                      {review.createdAtLabel ? (
                        <span className="text-xs text-muted-foreground">{review.createdAtLabel}</span>
                      ) : null}
                    </div>
                    <ItemListContent>
                      {review.comment ? (
                        <p className="whitespace-pre-wrap text-sm text-foreground">{review.comment}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </ItemListContent>
                  </ItemListItem>
                ))
              )}
            </ItemList>
          </>
        )}
      </CardContent>
    </Card>
  )
}
