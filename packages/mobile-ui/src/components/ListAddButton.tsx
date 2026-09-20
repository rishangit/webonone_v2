import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react-native'
import { Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { cn } from '../lib/cn'
import { CONTROL_ANIMATION_MS, controlEaseOut } from '../lib/controlAnimation'
import { useListPageActions } from '../layouts/pageHeaderSearchContext'
import { useThemeColors } from '../theme/ThemeProvider'
import { Button, type ButtonProps } from './Button'

export interface ListAddButtonProps extends Omit<ButtonProps, 'children'> {
  children: string
  compactLabel?: string
  compactOnMobile?: boolean
}

const labelClassName = 'text-base font-medium leading-none text-primary-foreground'

export function ListAddButton({
  children,
  compactLabel = 'Add',
  compactOnMobile,
  onPress,
  className,
  ...props
}: ListAddButtonProps) {
  const listPageActions = useListPageActions()
  const compact = listPageActions !== null && (compactOnMobile ?? true)
  const expanded = listPageActions?.addExpanded ?? false
  const labelsMatch = compactLabel === children
  const showFullLabel = !compact || expanded || labelsMatch
  const [compactWidth, setCompactWidth] = useState(0)
  const [fullWidth, setFullWidth] = useState(0)
  const compactWidthSV = useSharedValue(0)
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

  const compactColStyle = useAnimatedStyle(() => ({
    width: compactWidthSV.value * (1 - fullProgress.value),
  }))

  const fullColStyle = useAnimatedStyle(() => ({
    width: fullWidthSV.value * fullProgress.value,
  }))

  function handleCompactLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width
    setCompactWidth(width)
    compactWidthSV.value = width
  }

  function handleFullLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width
    setFullWidth(width)
    fullWidthSV.value = width
  }

  const icon = <Plus size={20} color={colors.primaryText} />

  if (!compact || labelsMatch) {
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
    <View className="shrink-0" onTouchStart={(event) => event.stopPropagation()}>
      <Button
        {...props}
        variant="default"
        size="sm"
        accessibilityLabel={children}
        accessibilityState={{ expanded }}
        onPress={handlePress}
        className={cn('shrink-0 justify-start overflow-hidden', className)}
      >
        <View className="flex-row items-center gap-2">
          {icon}
          <View className="flex-row overflow-hidden">
            <Animated.View className="overflow-hidden" style={compactColStyle}>
              <Text className={labelClassName} numberOfLines={1} style={{ width: compactWidth || undefined }}>
                {compactLabel}
              </Text>
            </Animated.View>
            <Animated.View className="overflow-hidden" style={fullColStyle}>
              <Text className={labelClassName} numberOfLines={1} style={{ width: fullWidth || undefined }}>
                {children}
              </Text>
            </Animated.View>
          </View>
        </View>
      </Button>
      <View pointerEvents="none" collapsable={false} className="absolute opacity-0">
        <View className="flex-row">
          <Text className={labelClassName} onLayout={handleCompactLayout}>
            {compactLabel}
          </Text>
          <Text className={labelClassName} onLayout={handleFullLayout}>
            {children}
          </Text>
        </View>
      </View>
    </View>
  )
}
