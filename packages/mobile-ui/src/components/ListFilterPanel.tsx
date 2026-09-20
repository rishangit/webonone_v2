import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { SlidersHorizontal } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { CONTROL_HEIGHT_SM_CLASS } from '../lib/controlStyles'
import { AppEndPanel } from '../layouts/AppEndPanel'
import { useThemeColors } from '../theme/ThemeProvider'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Button } from './Button'

export interface ListFilterTriggerProps {
  active: boolean
  onPress: () => void
  accessibilityLabel?: string
  className?: string
}

export function ListFilterTrigger({
  active,
  onPress,
  accessibilityLabel = 'Filters',
  className,
}: ListFilterTriggerProps) {
  const colors = useThemeColors()
  const iconColor = useThemedControlIconColor()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onTouchStart={(event) => event.stopPropagation()}
      className={cn(
        CONTROL_HEIGHT_SM_CLASS,
        'w-11 shrink-0 items-center justify-center rounded-control border border-input-border bg-transparent',
        active && 'border-primary',
        className,
      )}
    >
      <SlidersHorizontal size={18} color={active ? colors.primary : iconColor} strokeWidth={2} />
    </Pressable>
  )
}

export interface ListFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
  onApply?: () => void
  onClear?: () => void
  applyLabel?: string
  clearLabel?: string
}

export function ListFilterPanel({
  open,
  onOpenChange,
  title = 'Filters',
  children,
  onApply,
  onClear,
  applyLabel = 'Apply',
  clearLabel = 'Clear',
}: ListFilterPanelProps) {
  function close() {
    onOpenChange(false)
  }

  function handleApply() {
    onApply?.()
    onOpenChange(false)
  }

  function handleClear() {
    onClear?.()
    onOpenChange(false)
  }

  const footer =
    onApply || onClear ? (
      <View className="flex-row gap-2 p-4">
        {onClear ? (
          <Button variant="outline" className="flex-1" onPress={handleClear}>
            {clearLabel}
          </Button>
        ) : null}
        <Button className="flex-1" onPress={handleApply}>
          {applyLabel}
        </Button>
      </View>
    ) : undefined

  return (
    <AppEndPanel open={open} onClose={close} title={title} footer={footer} closeLabel="Close filters">
      {children}
    </AppEndPanel>
  )
}
