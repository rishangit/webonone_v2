import { useId, useState } from 'react'
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

export function PrimaryGradientFill({
  fromColor,
  toColor,
}: {
  fromColor: string
  toColor: string
}) {
  const gradientId = useId().replace(/:/g, '')
  const [size, setSize] = useState({ width: 0, height: 0 })

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout
    setSize((current) =>
      current.width === width && current.height === height ? current : { width, height },
    )
  }

  return (
    <View
      pointerEvents="none"
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFillObject, { backgroundColor: toColor }]}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={fromColor} />
              <Stop offset="1" stopColor={toColor} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#${gradientId})`} />
        </Svg>
      ) : null}
    </View>
  )
}
