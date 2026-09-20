import { Text, View } from 'react-native'
import { Muted } from '@webonone/mobile-ui'
import type { SessionToken } from '@/features/calendar/types/event.types'

function stepLabel(kind: 'check_in' | 'space' | 'done', label: string): string {
  if (kind === 'check_in') return 'Check-in'
  if (kind === 'done') return 'Done'
  return label
}

export function TokenWorkflowProgress({
  progress,
}: {
  progress?: SessionToken['workflowProgress'] | null
}) {
  if (!progress || progress.steps.length === 0) return null

  return (
    <View className="w-full flex-row flex-wrap items-center gap-x-1 gap-y-0.5 pt-2">
      {progress.steps.map((step, index) => {
        const isCurrent = progress.currentIndex >= 0 && index === progress.currentIndex
        const isPast = progress.currentIndex >= 0 && index < progress.currentIndex
        return (
          <View key={step.id} className="flex-row items-center gap-x-1">
            {index > 0 ? <Muted className="text-xs">›</Muted> : null}
            <Text
              className={
                isCurrent
                  ? 'text-xs font-semibold text-primary'
                  : isPast
                    ? 'text-xs text-muted'
                    : 'text-xs text-muted/70'
              }
            >
              {stepLabel(step.kind, step.label)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
