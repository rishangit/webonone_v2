import { Pressable, View } from 'react-native'
import { cn } from '../lib/cn'
import { Body } from './Typography'

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn('flex-row items-center gap-2', disabled && 'opacity-50')}
    >
      <View
        className={cn(
          'h-6 w-11 justify-center rounded-full px-0.5',
          checked ? 'bg-primary' : 'bg-border',
        )}
      >
        <View className={cn('h-5 w-5 rounded-full bg-background', checked ? 'self-end' : 'self-start')} />
      </View>
      {label ? <Body className="flex-1 text-base">{label}</Body> : null}
    </Pressable>
  )
}
