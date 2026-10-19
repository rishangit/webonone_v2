import { Card, Heading, Muted } from '@webonone/mobile-ui'

export function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="min-w-[40%] flex-1 p-4">
      <Muted className="text-sm">{title}</Muted>
      <Heading className="mt-1 text-2xl">{value}</Heading>
    </Card>
  )
}
