import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  STAR_RATING_FILLED_ICON_CLASSES,
  STAR_RATING_ICON_CLASSES,
  STAR_RATING_INPUT_BUTTON_PADDING,
  STAR_RATING_OUTLINE_ICON_CLASSES,
  type StarRatingSize,
} from './starRatingSizes'

export type StarRatingInputProps = {
  value: number | null
  onChange: (rating: number) => void
  max?: number
  size?: StarRatingSize
  disabled?: boolean
  id?: string
  className?: string
  /** Accessible label prefix, e.g. "Rating" */
  label?: string
}

export function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = 'lg',
  disabled = false,
  id,
  className,
  label = 'Rating',
}: StarRatingInputProps) {
  const starClass = STAR_RATING_ICON_CLASSES[size]
  const buttonPadding = STAR_RATING_INPUT_BUTTON_PADDING[size]
  const [hover, setHover] = React.useState<number | null>(null)

  const display = hover ?? value ?? 0

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1
        const filled = starValue <= display
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${label} ${starValue} of ${max}`}
            disabled={disabled}
            className={cn(
              'rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              buttonPadding,
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent',
            )}
            onMouseEnter={() => !disabled && setHover(starValue)}
            onFocus={() => !disabled && setHover(starValue)}
            onBlur={() => setHover(null)}
            onClick={() => !disabled && onChange(starValue)}
          >
            <Star
              className={cn(
                starClass,
                filled ? STAR_RATING_FILLED_ICON_CLASSES : STAR_RATING_OUTLINE_ICON_CLASSES,
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
