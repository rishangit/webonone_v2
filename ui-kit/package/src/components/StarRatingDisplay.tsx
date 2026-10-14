import { Star } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  STAR_RATING_FILLED_OVERLAY_ICON_CLASSES,
  STAR_RATING_ICON_CLASSES,
  STAR_RATING_OUTLINE_ICON_CLASSES,
  type StarRatingSize,
} from './starRatingSizes'

export type StarRatingDisplayProps = {
  /** Average or exact rating 0–5; null shows empty stars */
  value: number | null
  max?: number
  size?: StarRatingSize
  className?: string
  /** Accessible label, e.g. "Rating" */
  label?: string
}

function starFillPercent(starIndex: number, value: number): number {
  const clamped = Math.max(0, Math.min(5, value))
  const fill = clamped - (starIndex - 1)
  if (fill <= 0) return 0
  if (fill >= 1) return 100
  return Math.round(fill * 100)
}

export function StarRatingDisplay({
  value,
  max = 5,
  size = 'sm',
  className,
  label = 'Rating',
}: StarRatingDisplayProps) {
  const display = value != null && Number.isFinite(value) ? value : 0
  const starClass = STAR_RATING_ICON_CLASSES[size]

  return (
    <div
      role="img"
      aria-label={
        value != null && value > 0
          ? `${label}: ${display.toFixed(1)} out of ${max}`
          : `${label}: no rating`
      }
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starIndex = index + 1
        const percent = starFillPercent(starIndex, display)
        return (
          <span key={starIndex} className="relative inline-flex shrink-0">
            <Star className={cn(starClass, STAR_RATING_OUTLINE_ICON_CLASSES)} aria-hidden />
            {percent > 0 ? (
              <span
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: `${percent}%` }}
                aria-hidden
              >
                <Star
                  className={cn(starClass, 'block shrink-0', STAR_RATING_FILLED_OVERLAY_ICON_CLASSES)}
                />
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}
