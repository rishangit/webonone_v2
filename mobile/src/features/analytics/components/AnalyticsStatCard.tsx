import { Card, Muted, Subheading } from '@webonone/mobile-ui'

export function AnalyticsStatCard({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <Card className="min-w-[45%] flex-1 gap-1">
      <Muted className="text-sm font-medium">{title}</Muted>
      <Subheading className="text-2xl">{value}</Subheading>
    </Card>
  )
}
