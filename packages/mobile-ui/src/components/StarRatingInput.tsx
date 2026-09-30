import { Star } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../lib/cn'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export type StarRatingInputProps = {
  value: number | null
  onChange: (rating: number) => void
  max?: number
  disabled?: boolean
  label?: string
  className?: string
}

export function StarRatingInput({
  value,
  onChange,
  max = 5,
  disabled = false,
  label = 'Rating',
  className,
}: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null)
  const iconMuted = useThemedControlIconColor()
  const iconPrimary = useThemedControlIconColor({ active: true })
  const display = hover ?? value ?? 0

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={cn('flex-row items-center gap-1', className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1
        const filled = starValue <= display
        return (
          <Pressable
            key={starValue}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === starValue }}
            accessibilityLabel={`${label} ${starValue} of ${max}`}
            disabled={disabled}
            className={cn('rounded-md p-1', disabled ? 'opacity-50' : '')}
            onPress={() => !disabled && onChange(starValue)}
            onPressIn={() => !disabled && setHover(starValue)}
            onPressOut={() => setHover(null)}
          >
            <Star
              size={28}
              color={filled ? iconPrimary : iconMuted}
              fill={filled ? iconPrimary : 'transparent'}
            />
          </Pressable>
        )
      })}
    </View>
  )
}
