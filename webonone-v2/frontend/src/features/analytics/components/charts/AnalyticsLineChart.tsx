import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatLocaleDate } from '@/shared/utils/formatLocaleDate'
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE } from './chartTheme'

const PROFIT_STROKE = 'var(--color-success)'

export function AnalyticsLineChart({
  data,
  valueLabel,
  formatValue,
  language,
  profitLabel,
}: {
  data: Array<{ date: string; amount: number; profit?: number }>
  valueLabel: string
  formatValue?: (value: number) => string
  language?: string
  profitLabel?: string
}) {
  const showProfit = Boolean(profitLabel)
  return (
    <div className="h-64 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
          <XAxis
            dataKey="date"
            tick={CHART_AXIS.tick}
            stroke={CHART_AXIS.stroke}
            tickFormatter={(value: string) => formatLocaleDate(value, language)}
          />
          <YAxis tick={CHART_AXIS.tick} stroke={CHART_AXIS.stroke} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelFormatter={(value) => formatLocaleDate(String(value), language)}
            formatter={(value, name) => [
              formatValue ? formatValue(Number(value)) : String(value),
              String(name),
            ]}
          />
          {showProfit ? <Legend /> : null}
          <Line
            type="monotone"
            dataKey="amount"
            name={valueLabel}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          {showProfit ? (
            <Line
              type="monotone"
              dataKey="profit"
              name={profitLabel}
              stroke={PROFIT_STROKE}
              strokeWidth={2}
              dot={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
