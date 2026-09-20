import type { LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Muted, Subheading, useThemedControlIconColor } from '@webonone/mobile-ui'

export function SelectableOptionCard({
  title,
  description,
  selected,
  onPress,
  Icon,
}: {
  title: string
  description: string
  selected: boolean
  onPress: () => void
  Icon: LucideIcon
}) {
  const iconColor = useThemedControlIconColor({ active: selected })
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-md border px-4 py-4 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <View className="gap-3">
        <Icon size={20} color={iconColor} />
        <View className="gap-1">
          <Subheading className="text-base">{title}</Subheading>
          <Muted>{description}</Muted>
        </View>
      </View>
    </Pressable>
  )
}
