import { View } from 'react-native'
import { Card, Muted, ReadOnlyField, Subheading } from '@webonone/mobile-ui'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'
import type { ReactNode } from 'react'

export function EntityMetaCard({
  title = 'Meta',
  description = 'Record timestamps and references',
  createdLabel = 'Created',
  updatedLabel = 'Updated',
  referencesLabel = 'References',
  referenceCount,
  createdAt,
  updatedAt,
}: {
  title?: string
  description?: string
  createdLabel?: string
  updatedLabel?: string
  referencesLabel?: string
  referenceCount: number
  createdAt: string
  updatedAt: string
}) {
  return (
    <Card className="gap-4">
      <Subheading>{title}</Subheading>
      <Muted>{description}</Muted>
      <ReadOnlyField label={createdLabel} value={formatDisplayDateTime(createdAt)} />
      <ReadOnlyField label={updatedLabel} value={formatDisplayDateTime(updatedAt)} />
      <ReadOnlyField label={referencesLabel} value={String(referenceCount)} />
    </Card>
  )
}

export function DetailStack({ children }: { children: ReactNode }) {
  return <View className="gap-6">{children}</View>
}
