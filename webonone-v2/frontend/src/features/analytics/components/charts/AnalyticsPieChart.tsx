import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from './chartTheme'

export function AnalyticsPieChart({
  data,
  formatValue,
}: {
  data: Array<{ name: string; value: number }>
  formatValue?: (value: number) => string
}) {
  return (
    <div className="h-64 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} innerRadius={36}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              formatValue ? formatValue(Number(value)) : String(value),
              String(name),
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
