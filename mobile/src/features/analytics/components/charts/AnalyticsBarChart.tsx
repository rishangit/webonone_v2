import { View } from 'react-native'
import { Body, Muted } from '@webonone/mobile-ui'
import { useChartTheme } from '@/features/analytics/components/charts/chartTheme'

export function AnalyticsBarChart({
  data,
  valueLabel,
  formatValue,
  layout = 'vertical',
}: {
  data: Array<{ name: string; value: number }>
  valueLabel: string
  formatValue?: (value: number) => string
  layout?: 'vertical' | 'horizontal'
}) {
  const theme = useChartTheme()
  const max = Math.max(1, ...data.map((item) => item.value))

  if (layout === 'horizontal') {
    return (
      <View className="h-64 flex-row items-end justify-around gap-2 pt-2">
        {data.map((item) => (
          <View key={item.name} className="min-w-0 flex-1 items-center gap-1">
            <Muted numberOfLines={1}>{formatValue ? formatValue(item.value) : String(item.value)}</Muted>
            <View className="h-40 w-full justify-end rounded-sm" style={{ backgroundColor: theme.track }}>
              <View
                className="w-full rounded-sm"
                style={{
                  height: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
                  backgroundColor: theme.primary,
                }}
                accessibilityLabel={`${item.name} ${valueLabel} ${item.value}`}
              />
            </View>
            <Muted numberOfLines={2} className="text-center">
              {item.name}
            </Muted>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className="gap-3">
      {data.map((item) => (
        <View key={item.name} className="gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Body className="min-w-0 flex-1 text-sm" numberOfLines={2}>
              {item.name}
            </Body>
            <Muted>{formatValue ? formatValue(item.value) : String(item.value)}</Muted>
          </View>
          <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.track }}>
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
                backgroundColor: theme.primary,
              }}
              accessibilityLabel={`${item.name} ${valueLabel} ${item.value}`}
            />
          </View>
        </View>
      ))}
    </View>
  )
}
