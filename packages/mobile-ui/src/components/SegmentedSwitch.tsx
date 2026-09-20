import { createContext, useContext, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { cn } from '../lib/cn'
import { CONTROL_HEIGHT_CLASS, controlLabelClassName } from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { PrimaryGradientFill } from './PrimaryGradientFill'

type SegmentedContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null)

export function SegmentedSwitch({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <SegmentedContext.Provider value={{ value, onValueChange }}>
      <View
        className={cn(
          CONTROL_HEIGHT_CLASS,
          'flex-row items-stretch rounded-control border border-input-border bg-transparent p-1',
          className,
        )}
      >
        {children}
      </View>
    </SegmentedContext.Provider>
  )
}

export function SegmentedSwitchItem({
  value,
  children,
  disabled,
}: {
  value: string
  children: ReactNode
  disabled?: boolean
}) {
  const context = useContext(SegmentedContext)
  if (!context) {
    throw new Error('SegmentedSwitchItem must be used within SegmentedSwitch')
  }
  const selected = context.value === value
  const colors = useThemeColors()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => context.onValueChange(value)}
      className={cn(
        'relative min-w-0 flex-1 items-center justify-center overflow-hidden rounded-control px-5',
        disabled && 'opacity-50',
      )}
    >
      {selected ? <PrimaryGradientFill fromColor={colors.secondary} toColor={colors.primary} /> : null}
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'relative z-10',
            controlLabelClassName,
            selected ? 'text-primary-foreground' : 'text-muted',
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
