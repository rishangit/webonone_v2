import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE } from './chartTheme'

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
  const isVertical = layout === 'vertical'
  return (
    <div className="h-64 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
          {isVertical ? (
            <>
              <XAxis type="number" tick={CHART_AXIS.tick} stroke={CHART_AXIS.stroke} />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={CHART_AXIS.tick}
                stroke={CHART_AXIS.stroke}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={CHART_AXIS.tick} stroke={CHART_AXIS.stroke} />
              <YAxis tick={CHART_AXIS.tick} stroke={CHART_AXIS.stroke} />
            </>
          )}
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [formatValue ? formatValue(Number(value)) : String(value), valueLabel]}
          />
          <Bar dataKey="value" name={valueLabel} fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
