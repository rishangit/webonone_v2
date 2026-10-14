import { View } from 'react-native'
import { Body, Muted, cn } from '@webonone/mobile-ui'

export function ServiceScheduleMeta({
  timeModeLabel,
  scheduleSummary,
  className,
}: {
  timeModeLabel: string | null
  scheduleSummary: string
  className?: string
}) {
  if (!timeModeLabel) return null

  return (
    <View className={cn('min-w-0', className)}>
      <View className="flex-row flex-wrap items-baseline gap-x-1.5">
        <Body className="shrink-0 text-sm">{timeModeLabel}</Body>
        <Muted className="min-w-0 shrink text-sm">{scheduleSummary}</Muted>
      </View>
    </View>
  )
}
