import { Text } from 'react-native'
import { cn } from '../lib/cn'
import { formatRemainingDuration } from '../lib/formatRemainingDuration'

export type RemainingTimeKind = 'upcoming' | 'current' | 'ended'
export type RemainingTimeRunStatus = 'scheduled' | 'started' | 'ended'

export type RemainingTimeState = {
  kind: RemainingTimeKind
  label: string
}

export type RemainingTimeLabels = {
  ended?: string
  due?: string
}

export type RemainingTimeProps = {
  start: string
  end: string
  now?: Date
  runStatus?: RemainingTimeRunStatus
  labels?: RemainingTimeLabels
  appearance?: 'chip' | 'plain'
  className?: string
}

export function resolveRemainingTime(
  startIso: string,
  endIso: string,
  now: Date = new Date(),
  labels?: RemainingTimeLabels,
  runStatus?: RemainingTimeRunStatus,
): RemainingTimeState {
  const endedLabel = labels?.ended ?? 'Ended'
  const dueLabel = labels?.due ?? 'Due'
  const start = new Date(startIso)
  const end = new Date(endIso)
  const nowMs = now.getTime()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { kind: 'ended', label: endedLabel }
  }

  if (runStatus === 'ended') {
    return { kind: 'ended', label: endedLabel }
  }

  if (runStatus === 'scheduled') {
    if (nowMs < start.getTime()) {
      const remaining = formatRemainingDuration(start.getTime() - nowMs)
      return { kind: 'upcoming', label: remaining || dueLabel }
    }
    if (nowMs < end.getTime()) {
      return { kind: 'upcoming', label: dueLabel }
    }
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

const KIND_CLASS: Record<RemainingTimeKind, string> = {
  upcoming: 'border-amber-300 bg-amber-50 text-amber-900',
  current: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  ended: 'border-border bg-border text-muted',
}

export function RemainingTime({
  start,
  end,
  now,
  runStatus,
  labels,
  appearance = 'chip',
  className,
}: RemainingTimeProps) {
  const timing = resolveRemainingTime(start, end, now, labels, runStatus)

  return (
    <Text
      className={cn(
        'self-start text-xs font-semibold',
        appearance === 'chip'
          ? cn('rounded-full border px-2 py-0.5', KIND_CLASS[timing.kind])
          : timing.kind === 'ended'
            ? 'font-normal text-muted'
            : 'text-primary',
        className,
      )}
    >
      {timing.label}
    </Text>
  )
}
