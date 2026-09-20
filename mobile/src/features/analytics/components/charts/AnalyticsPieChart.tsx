import { useMemo, useState } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Body, Muted } from '@webonone/mobile-ui'
import { useChartTheme } from '@/features/analytics/components/charts/chartTheme'

const HEIGHT = 220

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function donutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle
  if (sweep >= 359.99) {
    return `${donutSlice(cx, cy, outerR, innerR, startAngle, startAngle + 180)} ${donutSlice(
      cx,
      cy,
      outerR,
      innerR,
      startAngle + 180,
      endAngle,
    )}`
  }
  const large = sweep > 180 ? 1 : 0
  const outerStart = polar(cx, cy, outerR, startAngle)
  const outerEnd = polar(cx, cy, outerR, endAngle)
  const innerStart = polar(cx, cy, innerR, endAngle)
  const innerEnd = polar(cx, cy, innerR, startAngle)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ')
}

export function AnalyticsPieChart({
  data,
  formatValue,
}: {
  data: Array<{ name: string; value: number }>
  formatValue?: (value: number) => string
}) {
  const theme = useChartTheme()
  const [width, setWidth] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const slices = useMemo(() => {
    let cursor = 0
    return data.map((item, index) => {
      const sweep = total > 0 ? (item.value / total) * 360 : 0
      const start = cursor
      const end = cursor + sweep
      cursor = end
      return { ...item, start, end, color: theme.slices[index % theme.slices.length] }
    })
  }, [data, theme.slices, total])

  function handleLayout(event: LayoutChangeEvent) {
    const next = Math.round(event.nativeEvent.layout.width)
    setWidth((current) => (current === next ? current : next))
  }

  const size = Math.min(width || HEIGHT, HEIGHT)
  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.38
  const innerR = size * 0.16
  const selectedItem = selected != null ? slices[selected] : null

  return (
    <View className="gap-3">
      <View onLayout={handleLayout} className="w-full items-center">
        {width > 0 ? (
          <Svg width={size} height={size}>
            {slices.map((slice, index) =>
              slice.value > 0 ? (
                <Path
                  key={slice.name}
                  d={donutSlice(cx, cy, outerR, innerR, slice.start, slice.end)}
                  fill={slice.color}
                  onPress={() => setSelected(index)}
                />
              ) : null,
            )}
          </Svg>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>
      <View className="gap-2">
        {slices.map((slice, index) => (
          <Pressable
            key={slice.name}
            onPress={() => setSelected(index)}
            accessibilityRole="button"
            accessibilityLabel={slice.name}
            className="flex-row items-center gap-2"
          >
            <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} />
            <Body className="min-w-0 flex-1 text-sm" numberOfLines={1}>
              {slice.name}
            </Body>
            <Muted>{formatValue ? formatValue(slice.value) : String(slice.value)}</Muted>
          </Pressable>
        ))}
      </View>
      {selectedItem ? (
        <Muted>
          {selectedItem.name} · {formatValue ? formatValue(selectedItem.value) : String(selectedItem.value)}
        </Muted>
      ) : null}
    </View>
  )
}
