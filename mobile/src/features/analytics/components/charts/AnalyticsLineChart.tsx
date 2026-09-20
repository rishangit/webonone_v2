import { useMemo, useState } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg'
import { Muted } from '@webonone/mobile-ui'
import { formatAxisValue, useChartTheme } from '@/features/analytics/components/charts/chartTheme'
import { formatChartDate } from '@/features/analytics/utils/formatChartDate'
import type { AppLocale } from '@/shared/types'

const HEIGHT = 220
const PAD = { top: 16, right: 12, bottom: 36, left: 40 }

export function AnalyticsLineChart({
  data,
  valueLabel,
  formatValue,
  locale,
  profitLabel,
  tapHint,
}: {
  data: Array<{ date: string; amount: number; profit?: number }>
  valueLabel: string
  formatValue?: (value: number) => string
  locale: AppLocale
  profitLabel?: string
  tapHint?: string
}) {
  const theme = useChartTheme()
  const [width, setWidth] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const showProfit = Boolean(profitLabel)

  const plot = useMemo(() => {
    const innerW = Math.max(width - PAD.left - PAD.right, 1)
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const maxValue = Math.max(
      1,
      ...data.map((item) => item.amount),
      ...(showProfit ? data.map((item) => item.profit ?? 0) : []),
    )
    const last = Math.max(data.length - 1, 1)
    function xAt(index: number) {
      return PAD.left + (index / last) * innerW
    }
    function yAt(value: number) {
      return PAD.top + innerH - (value / maxValue) * innerH
    }
    const amountPoints = data.map((item, index) => `${xAt(index)},${yAt(item.amount)}`).join(' ')
    const profitPoints = showProfit
      ? data.map((item, index) => `${xAt(index)},${yAt(item.profit ?? 0)}`).join(' ')
      : ''
    return { maxValue, xAt, yAt, amountPoints, profitPoints }
  }, [data, showProfit, width])

  function handleLayout(event: LayoutChangeEvent) {
    const next = Math.round(event.nativeEvent.layout.width)
    setWidth((current) => (current === next ? current : next))
  }

  function handlePress(locationX: number) {
    if (data.length === 0) return
    let nearest = 0
    let best = Number.POSITIVE_INFINITY
    data.forEach((_, index) => {
      const dist = Math.abs(plot.xAt(index) - locationX)
      if (dist < best) {
        best = dist
        nearest = index
      }
    })
    setSelected(nearest)
  }

  const tickIndexes =
    data.length <= 3 ? data.map((_, index) => index) : [0, Math.floor((data.length - 1) / 2), data.length - 1]
  const selectedPoint = selected != null ? data[selected] : null

  return (
    <View className="gap-2">
      <View onLayout={handleLayout} className="w-full">
        {width > 0 ? (
          <Pressable
            onPress={(event) => handlePress(event.nativeEvent.locationX)}
            accessibilityRole="button"
            accessibilityLabel={valueLabel}
          >
            <Svg width={width} height={HEIGHT}>
              {[0, 0.5, 1].map((ratio) => {
                const y = plot.yAt(plot.maxValue * ratio)
                return (
                  <Line
                    key={ratio}
                    x1={PAD.left}
                    y1={y}
                    x2={width - PAD.right}
                    y2={y}
                    stroke={theme.grid}
                    strokeDasharray="4 4"
                  />
                )
              })}
              {[0, 0.5, 1].map((ratio) => (
                <SvgText
                  key={`y-${ratio}`}
                  x={PAD.left - 6}
                  y={plot.yAt(plot.maxValue * ratio) + 4}
                  fill={theme.muted}
                  fontSize={10}
                  textAnchor="end"
                >
                  {formatAxisValue(plot.maxValue * ratio)}
                </SvgText>
              ))}
              <Polyline
                points={plot.amountPoints}
                fill="none"
                stroke={theme.primary}
                strokeWidth={2}
              />
              {showProfit ? (
                <Polyline
                  points={plot.profitPoints}
                  fill="none"
                  stroke={theme.profit}
                  strokeWidth={2}
                />
              ) : null}
              {tickIndexes.map((index) => (
                <SvgText
                  key={data[index]?.date ?? index}
                  x={plot.xAt(index)}
                  y={HEIGHT - 12}
                  fill={theme.muted}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {formatChartDate(data[index]?.date ?? '', locale)}
                </SvgText>
              ))}
              {selectedPoint && selected != null ? (
                <>
                  <Circle
                    cx={plot.xAt(selected)}
                    cy={plot.yAt(selectedPoint.amount)}
                    r={4}
                    fill={theme.primary}
                  />
                  {showProfit ? (
                    <Circle
                      cx={plot.xAt(selected)}
                      cy={plot.yAt(selectedPoint.profit ?? 0)}
                      r={4}
                      fill={theme.profit}
                    />
                  ) : null}
                </>
              ) : null}
            </Svg>
          </Pressable>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>
      {showProfit ? (
        <View className="flex-row flex-wrap gap-3">
          <Muted>
            ● {valueLabel}
          </Muted>
          <Muted>
            ● {profitLabel}
          </Muted>
        </View>
      ) : null}
      {selectedPoint ? (
        <Muted>
          {formatChartDate(selectedPoint.date, locale)} · {valueLabel}{' '}
          {formatValue ? formatValue(selectedPoint.amount) : String(selectedPoint.amount)}
          {showProfit
            ? ` · ${profitLabel} ${
                formatValue
                  ? formatValue(selectedPoint.profit ?? 0)
                  : String(selectedPoint.profit ?? 0)
              }`
            : ''}
        </Muted>
      ) : (
        tapHint ? <Muted>{tapHint}</Muted> : null
      )}
    </View>
  )
}
