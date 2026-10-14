import { Button } from './Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { CatalogReviewListItem } from './CatalogReviewListItem'
import type { CatalogReviewListItemData } from './catalogReviewTypes'
import { ItemList } from './ItemList'
import type { StarRatingSize } from './starRatingSizes'

export type CatalogOwnReviewCardProps = {
  title?: string
  description?: string
  loading?: boolean
  loadingLabel?: string
  review?: CatalogReviewListItemData | null
  ratingLabel?: string
  starSize?: StarRatingSize
  reviewerFallbackLabel?: string
  writeLabel?: string
  editLabel?: string
  onWrite?: () => void
  onEdit?: () => void
}

export function CatalogOwnReviewCard({
  title = 'Your review',
  description = 'Rate this catalog item and share optional feedback.',
  loading = false,
  loadingLabel = 'Loading your review…',
  review = null,
  ratingLabel = 'Rating',
  starSize = 'md',
  reviewerFallbackLabel = 'You',
  writeLabel = 'Write a review',
  editLabel = 'Edit review',
  onWrite,
  onEdit,
}: CatalogOwnReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : review ? (
          <>
            <ItemList>
              <CatalogReviewListItem
                review={review}
                ratingLabel={ratingLabel}
                starSize={starSize}
                reviewerFallbackLabel={reviewerFallbackLabel}
              />
            </ItemList>
            {onEdit ? (
              <Button type="button" size="sm" variant="outline" onClick={onEdit}>
                {editLabel}
              </Button>
            ) : null}
          </>
        ) : onWrite ? (
          <Button type="button" size="sm" onClick={onWrite}>
            {writeLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
