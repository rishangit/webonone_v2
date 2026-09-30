import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '../lib/utils'

export type StarRatingInputProps = {
  value: number | null
  onChange: (rating: number) => void
  max?: number
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
  disabled = false,
  id,
  className,
  label = 'Rating',
}: StarRatingInputProps) {
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
              'rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent',
            )}
            onMouseEnter={() => !disabled && setHover(starValue)}
            onFocus={() => !disabled && setHover(starValue)}
            onBlur={() => setHover(null)}
            onClick={() => !disabled && onChange(starValue)}
          >
            <Star
              className={cn(
                'h-7 w-7',
                filled ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground',
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
