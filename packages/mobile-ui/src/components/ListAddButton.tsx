import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react-native'
import { Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { cn } from '../lib/cn'
import { CONTROL_ANIMATION_MS, controlEaseOut } from '../lib/controlAnimation'
import { CONTROL_HEIGHT_SM_CLASS } from '../lib/controlStyles'
import { useListPageActions } from '../layouts/pageHeaderSearchContext'
import { useThemeColors } from '../theme/ThemeProvider'
import { Button, type ButtonProps } from './Button'

export interface ListAddButtonProps extends Omit<ButtonProps, 'children'> {
  children: string
  /**
   * @deprecated Collapsed state is icon-only; this prop is ignored for display.
   * Kept for call-site compatibility.
   */
  compactLabel?: string
  compactOnMobile?: boolean
}

const labelClassName = 'text-base font-medium leading-none text-primary-foreground'

export function ListAddButton({
  children,
  compactLabel: _compactLabel,
  compactOnMobile,
  onPress,
  className,
  ...props
}: ListAddButtonProps) {
  const listPageActions = useListPageActions()
  const compact = listPageActions !== null && (compactOnMobile ?? true)
  const expanded = listPageActions?.addExpanded ?? false
  const showFullLabel = !compact || expanded
  const [fullWidth, setFullWidth] = useState(0)
  const fullWidthSV = useSharedValue(0)
  const fullProgress = useSharedValue(showFullLabel ? 1 : 0)
  const colors = useThemeColors()

  useEffect(() => {
    fullProgress.value = withTiming(showFullLabel ? 1 : 0, {
      duration: CONTROL_ANIMATION_MS,
      easing: controlEaseOut,
    })
  }, [fullProgress, showFullLabel])

  function handlePress(event: GestureResponderEvent) {
    if (compact && !showFullLabel) {
      listPageActions?.expandAdd()
      return
    }
    onPress?.(event)
    listPageActions?.collapseAdd()
  }

  const labelColStyle = useAnimatedStyle(() => ({
    width: fullWidthSV.value * fullProgress.value,
  }))

  function handleFullLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width
    setFullWidth(width)
    fullWidthSV.value = width
  }

  const icon = <Plus size={20} color={colors.primaryText} />

  if (!compact) {
    return (
      <Button
        {...props}
        variant="default"
        size="sm"
        accessibilityLabel={children}
        onPress={handlePress}
        className={className}
      >
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={labelClassName}>{children}</Text>
        </View>
      </Button>
    )
  }

  return (
    <View className="shrink-0">
      <Button
        {...props}
        variant="default"
        size="sm"
        accessibilityLabel={children}
        accessibilityState={{ expanded }}
        onPress={handlePress}
        className={cn(
          CONTROL_HEIGHT_SM_CLASS,
          'shrink-0 justify-center overflow-hidden',
          expanded ? 'justify-start px-6' : 'w-11 min-w-11 max-w-11 px-0',
          className,
        )}
      >
        <View className={cn('flex-row items-center', expanded ? 'gap-2' : 'gap-0')}>
          {icon}
          <Animated.View className="overflow-hidden" style={labelColStyle}>
            <Text className={labelClassName} numberOfLines={1} style={{ width: fullWidth || undefined }}>
              {children}
            </Text>
          </Animated.View>
        </View>
      </Button>
      <View pointerEvents="none" collapsable={false} className="absolute opacity-0">
        <Text className={labelClassName} onLayout={handleFullLayout}>
          {children}
        </Text>
      </View>
    </View>
  )
}
