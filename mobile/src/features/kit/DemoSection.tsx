import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Card, Muted, Subheading } from '@webonone/mobile-ui'

export function DemoSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <View className="gap-2">
      <View className="gap-1">
        <Subheading>{title}</Subheading>
        {description ? <Muted>{description}</Muted> : null}
      </View>
      <Card className="gap-3">{children}</Card>
    </View>
  )
}
