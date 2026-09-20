import { StatusTag } from '@webonone/mobile-ui'
import { Muted } from '@webonone/mobile-ui'
import { View } from 'react-native'
import type { SessionScheduleChangeKind } from '@/features/calendar/types/event.types'

export function scheduleChangeKindLabel(
  kind: SessionScheduleChangeKind | null | undefined,
): string | null {
  if (kind === 'delayed') return 'Delayed'
  if (kind === 'early') return 'Early'
  return null
}

export function SessionScheduleChangeMeta({
  scheduleChanged,
  scheduleChangeKind,
  originalStartTime,
  originalEndTime,
}: {
  scheduleChanged?: boolean
  scheduleChangeKind?: SessionScheduleChangeKind | null
  originalStartTime?: string | null
  originalEndTime?: string | null
}) {
  if (!scheduleChanged || !scheduleChangeKind) return null
  const kindLabel = scheduleChangeKindLabel(scheduleChangeKind)
  return (
    <View className="gap-1">
      {originalStartTime && originalEndTime ? (
        <Muted className="text-xs">
          Was {originalStartTime}–{originalEndTime}
        </Muted>
      ) : null}
      {kindLabel ? <StatusTag variant="pending">{kindLabel}</StatusTag> : null}
    </View>
  )
}
