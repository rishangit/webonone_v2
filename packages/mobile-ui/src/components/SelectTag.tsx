import { Pressable, Text, View } from 'react-native'
import { ChevronDown, Tag } from 'lucide-react-native'
import { TagChip } from './TagChip'
import { cn } from '../lib/cn'
import { controlPickerTriggerClassName } from '../lib/controlStyles'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export interface SelectTagValue {
  id: string
  name: string
  color: string
}

export interface SelectTagProps {
  selectedTag?: SelectTagValue | null
  selectedTags?: SelectTagValue[]
  multiple?: boolean
  placeholder?: string
  maxVisibleTags?: number
  disabled?: boolean
  onPress?: () => void
}

export function SelectTag({
  selectedTag,
  selectedTags = [],
  multiple = false,
  placeholder = 'Select tag',
  maxVisibleTags = 4,
  disabled,
  onPress,
}: SelectTagProps) {
  const tags = multiple ? selectedTags : selectedTag ? [selectedTag] : []
  const hasSelection = tags.length > 0
  const visible = tags.slice(0, maxVisibleTags)
  const overflow = tags.length - visible.length
  const iconColor = useThemedControlIconColor()

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={cn(
        controlPickerTriggerClassName,
        disabled && 'opacity-50',
      )}
    >
      {hasSelection ? (
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
          {visible.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {overflow > 0 ? <Text className="text-xs text-muted">+{overflow}</Text> : null}
        </View>
      ) : (
        <>
          <View className="h-8 w-8 shrink-0 items-center justify-center">
            <Tag size={20} color={iconColor} />
          </View>
          <Text className="flex-1 text-base text-muted">{placeholder}</Text>
        </>
      )}
      <ChevronDown size={20} color={iconColor} />
    </Pressable>
  )
}
