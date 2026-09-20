import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Card, Muted, Subheading } from '@webonone/mobile-ui'

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
    <Card className="min-w-0 gap-3">
      <Subheading className="text-base">{title}</Subheading>
      {emptyLabel ? (
        <View className="h-64 items-center justify-center">
          <Muted>{emptyLabel}</Muted>
        </View>
      ) : (
        children
      )}
    </Card>
  )
}
