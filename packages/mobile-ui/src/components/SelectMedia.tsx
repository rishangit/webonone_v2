import { Pressable, View } from 'react-native'
import { ChevronDown, Image as ImageIcon } from 'lucide-react-native'
import { ImagePreview } from './ImagePreview'
import { Muted } from './Typography'
import { cn } from '../lib/cn'
import { controlPickerTriggerClassName } from '../lib/controlStyles'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export interface SelectMediaValue {
  id: string
  url: string
  alt?: string
}

export function SelectMedia({
  value,
  placeholder = 'Select media',
  disabled,
  onPress,
}: {
  value?: SelectMediaValue | null
  placeholder?: string
  disabled?: boolean
  onPress?: () => void
}) {
  const iconColor = useThemedControlIconColor()
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={cn(controlPickerTriggerClassName, disabled && 'opacity-50')}
    >
      {value ? (
        <ImagePreview src={value.url} alt={value.alt ?? value.id} className="h-8 w-8 rounded-md" />
      ) : (
        <View className="h-8 w-8 shrink-0 items-center justify-center rounded-md bg-border">
          <ImageIcon size={20} color={iconColor} />
        </View>
      )}
      <Muted className="flex-1 text-base">{value?.alt ?? placeholder}</Muted>
      <ChevronDown size={20} color={iconColor} />
    </Pressable>
  )
}
