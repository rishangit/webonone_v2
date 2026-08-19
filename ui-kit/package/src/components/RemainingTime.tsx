import { cn } from '../lib/utils'
import { formatRemainingDuration } from '../lib/formatRemainingDuration'

export type RemainingTimeKind = 'upcoming' | 'current' | 'ended'

export type RemainingTimeState = {
  kind: RemainingTimeKind
  label: string
}

export type RemainingTimeLabels = {
  ended?: string
}

export type RemainingTimeProps = {
  start: string
  end: string
  now?: Date
  labels?: RemainingTimeLabels
  className?: string
}

export function resolveRemainingTime(
  startIso: string,
  endIso: string,
  now: Date = new Date(),
  labels?: RemainingTimeLabels,
): RemainingTimeState {
  const endedLabel = labels?.ended ?? 'Ended'
  const start = new Date(startIso)
  const end = new Date(endIso)
  const nowMs = now.getTime()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { kind: 'ended', label: endedLabel }
  }

  if (nowMs >= start.getTime() && nowMs < end.getTime()) {
    const remaining = formatRemainingDuration(end.getTime() - nowMs)
    return { kind: 'current', label: remaining || endedLabel }
  }

  if (nowMs < start.getTime()) {
    const remaining = formatRemainingDuration(start.getTime() - nowMs)
    return { kind: 'upcoming', label: remaining || endedLabel }
  }

  return { kind: 'ended', label: endedLabel }
}

function RemainingTime({ start, end, now, labels, className }: RemainingTimeProps) {
  const timing = resolveRemainingTime(start, end, now, labels)

  return (
    <span
      className={cn(
        'shrink-0 text-right text-xs',
        timing.kind === 'current'
          ? 'font-medium text-primary'
          : 'text-muted-foreground',
        className,
      )}
    >
      {timing.label}
    </span>
  )
}

export { RemainingTime }
