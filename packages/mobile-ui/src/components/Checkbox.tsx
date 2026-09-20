import { Pressable, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { useThemeColors } from '../theme/ThemeProvider'
import { Body } from './Typography'

export function Checkbox({
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
  const colors = useThemeColors()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn('flex-row items-center gap-2', disabled && 'opacity-50')}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-md border',
          checked ? 'border-primary bg-primary' : 'border-input-border bg-transparent',
        )}
      >
        {checked ? <Check size={16} color={colors.primaryText} strokeWidth={2.5} /> : null}
      </View>
      {label ? <Body className="flex-1 text-base">{label}</Body> : null}
    </Pressable>
  )
}
