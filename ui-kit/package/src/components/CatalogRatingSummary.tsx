import { cn } from '../lib/utils'
import { StarRatingDisplay } from './StarRatingDisplay'
import type { StarRatingSize } from './starRatingSizes'

export type CatalogRatingSummaryProps = {
  averageRating: number | null
  reviewCount: number
  /** e.g. "(12 reviews)" — pass from i18n */
  countLabel?: string
  size?: StarRatingSize
  className?: string
  ratingLabel?: string
  /** Render empty stars when there are no reviews (details card). List cards omit. */
  showEmpty?: boolean
}

export function CatalogRatingSummary({
  averageRating,
  reviewCount,
  countLabel,
  size = 'sm',
  className,
  ratingLabel = 'Rating',
  showEmpty = false,
}: CatalogRatingSummaryProps) {
  if (reviewCount <= 0 && !showEmpty) {
    return null
  }

  const countClass =
    size === 'sm'
      ? 'text-xs tabular-nums text-muted-foreground'
      : 'text-sm font-medium tabular-nums text-foreground'

  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-1.5', className)}>
      <StarRatingDisplay value={averageRating} size={size} label={ratingLabel} />
      {countLabel ? (
        <span className={countClass}>{countLabel}</span>
      ) : (
        <span className={countClass}>({reviewCount})</span>
      )}
    </div>
  )
}
