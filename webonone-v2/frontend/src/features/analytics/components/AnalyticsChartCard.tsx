import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@webonone/ui-kit'

export function AnalyticsChartCard({
  title,
  emptyLabel,
  children,
}: {
  title: string
  emptyLabel?: string | null
  children: ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {emptyLabel ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
