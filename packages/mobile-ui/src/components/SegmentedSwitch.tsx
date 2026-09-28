import { createContext, useContext, type ReactNode } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { cn } from '../lib/cn'
import { controlDisplayTextProps } from '../lib/controlStyles'
import {
  segmentedSwitchHeights,
  segmentedSwitchItemClassName,
  segmentedSwitchItemLabelClassName,
  segmentedSwitchItemPadding,
  segmentedSwitchTrackClassName,
} from '../lib/segmentedControlStyles'
import { useMobileTheme, useThemeColors } from '../theme/ThemeProvider'
import { deriveInputBorderRgba } from '../theme/themeVars'
import { PrimaryGradientFill } from './PrimaryGradientFill'

export type SegmentedSwitchSize = 'default' | 'sm'

type SegmentedContextValue = {
  value: string
  onValueChange: (value: string) => void
  size: SegmentedSwitchSize
  disabled?: boolean
}

type SegmentedItemContextValue = {
  selected: boolean
  labelColor: string
  size: SegmentedSwitchSize
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null)
const SegmentedItemContext = createContext<SegmentedItemContextValue | null>(null)

export function useSegmentedSwitchItemColors(): SegmentedItemContextValue {
  const context = useContext(SegmentedItemContext)
  if (!context) {
    throw new Error('useSegmentedSwitchItemColors must be used within SegmentedSwitchItem')
  }
  return context
}

function selectedSegmentShadow(focusColor: string): ViewStyle {
  return {
    shadowColor: focusColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  }
}

export function SegmentedSwitch({
  value,
  onValueChange,
  children,
  className,
  size = 'default',
  accessibilityLabel,
  disabled,
}: {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
  size?: SegmentedSwitchSize
  accessibilityLabel?: string
  disabled?: boolean
}) {
  const { colors, colorMode } = useMobileTheme()
  const trackStyle = {
    borderColor: deriveInputBorderRgba(colors, colorMode),
  }

  return (
    <SegmentedContext.Provider value={{ value, onValueChange, size, disabled }}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        className={cn(
          segmentedSwitchHeights[size],
          segmentedSwitchTrackClassName,
          'min-w-0 self-start',
          disabled && 'opacity-50',
          className,
        )}
        style={trackStyle}
        pointerEvents={disabled ? 'none' : 'auto'}
      >
        {children}
      </View>
    </SegmentedContext.Provider>
  )
}

export function SegmentedSwitchItemText({ children }: { children: string }) {
  const { labelColor } = useSegmentedSwitchItemColors()
  return (
    <Text
      className={segmentedSwitchItemLabelClassName}
      style={{ color: labelColor }}
      {...controlDisplayTextProps()}
    >
      {children}
    </Text>
  )
}

export function SegmentedSwitchItem({
  value,
  children,
  disabled: itemDisabled,
  className,
  style,
}: {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
  style?: StyleProp<ViewStyle>
}) {
  const context = useContext(SegmentedContext)
  if (!context) {
    throw new Error('SegmentedSwitchItem must be used within SegmentedSwitch')
  }
  const selected = context.value === value
  const colors = useThemeColors()
  const { size, disabled: groupDisabled } = context
  const disabled = groupDisabled || itemDisabled
  const labelColor = selected ? colors.primaryText : colors.textLabel

  return (
    <SegmentedItemContext.Provider value={{ selected, labelColor, size }}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => context.onValueChange(value)}
        className={cn(
          segmentedSwitchItemClassName,
          segmentedSwitchItemPadding[size],
          className,
        )}
        style={[selected ? selectedSegmentShadow(colors.focus) : undefined, style]}
      >
        {selected ? <PrimaryGradientFill fromColor={colors.secondary} toColor={colors.primary} /> : null}
        {typeof children === 'string' ? (
          <View className="relative z-10" style={{ zIndex: 1, elevation: 1 }}>
            <Text
              className={segmentedSwitchItemLabelClassName}
              style={{ color: labelColor }}
              {...controlDisplayTextProps()}
            >
              {children}
            </Text>
          </View>
        ) : (
          <View className="relative z-10 flex-row items-center justify-center gap-2" style={{ zIndex: 1, elevation: 1 }}>
            {children}
          </View>
        )}
      </Pressable>
    </SegmentedItemContext.Provider>
  )
}
