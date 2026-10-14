import { Star } from 'lucide-react-native'
import { View } from 'react-native'
import { cn } from '../lib/cn'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { STAR_RATING_ICON_PX, type StarRatingSize } from './starRatingSizes'

export type StarRatingDisplayProps = {
  value: number | null
  max?: number
  size?: StarRatingSize
  className?: string
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
  const iconMuted = useThemedControlIconColor()
  const iconPrimary = useThemedControlIconColor({ active: true })
  const display = value != null && Number.isFinite(value) ? value : 0
  const iconPx = STAR_RATING_ICON_PX[size]

  const accessibilityLabel =
    value != null && value > 0
      ? `${label}: ${display.toFixed(1)} out of ${max}`
      : `${label}: no rating`

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn('flex-row items-center gap-0.5', className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starIndex = index + 1
        const percent = starFillPercent(starIndex, display)
        return (
          <View key={starIndex} className="relative shrink-0">
            <Star size={iconPx} color={iconMuted} fill="transparent" />
            {percent > 0 ? (
              <View
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: `${percent}%` }}
              >
                <Star size={iconPx} color={iconPrimary} fill={iconPrimary} />
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}
