export const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.75)',
  'hsl(var(--primary) / 0.5)',
  'hsl(var(--muted-foreground))',
  'hsl(var(--primary) / 0.35)',
]

export const CHART_AXIS = {
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
  stroke: 'hsl(var(--glass-border))',
}

export const CHART_GRID = 'hsl(var(--glass-border))'
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--glass-border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
}
