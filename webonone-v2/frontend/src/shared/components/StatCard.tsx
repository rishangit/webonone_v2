import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@webonone/ui-kit'

export function StatCard({ title, value }: { title: string; value: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
