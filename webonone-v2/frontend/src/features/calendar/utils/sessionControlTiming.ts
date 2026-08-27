import { formatRemainingDuration } from '@webonone/ui-kit'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import type { SessionRunStatus } from '@/features/calendar/types/event.types'

export type SessionControlTimingDisplay =
  | { kind: 'empty' }
  | { kind: 'actual'; text: string }
  | { kind: 'due'; duration: string }
  | { kind: 'delayed'; duration: string }

export type SessionControlTimingInput = {
  runStatus: SessionRunStatus
  now: Date
  language: string
  scheduledStartIso: string
  scheduledEndIso: string
  startedAt: string | null | undefined
  endedAt: string | null | undefined
}

export function buildScheduledSessionInstant(occurrenceDate: string, hhmm: string): string {
  return `${occurrenceDate}T${hhmm}:00`
}

function formatActual(
  iso: string | null | undefined,
  language: string,
): SessionControlTimingDisplay {
  if (!iso) return { kind: 'empty' }
  return { kind: 'actual', text: formatLocaleDateTime(iso, language) }
}

function dueDuration(untilMs: number): SessionControlTimingDisplay {
  const duration = formatRemainingDuration(untilMs)
  return { kind: 'due', duration: duration || '1min' }
}

function delayedDuration(sinceMs: number): SessionControlTimingDisplay {
  const duration = formatRemainingDuration(sinceMs)
  return { kind: 'delayed', duration: duration || '1min' }
}

export function resolveSessionControlStarted(
  input: SessionControlTimingInput,
): SessionControlTimingDisplay {
  const { runStatus, now, language, scheduledStartIso, startedAt } = input

  if (runStatus === 'started' || runStatus === 'ended') {
    return formatActual(startedAt, language)
  }

  const start = new Date(scheduledStartIso)
  if (Number.isNaN(start.getTime())) {
    return { kind: 'empty' }
  }

  const nowMs = now.getTime()
  if (nowMs < start.getTime()) {
    return dueDuration(start.getTime() - nowMs)
  }

  return delayedDuration(nowMs - start.getTime())
}

export function resolveSessionControlEnded(
  input: SessionControlTimingInput,
): SessionControlTimingDisplay {
  const { runStatus, now, language, scheduledEndIso, endedAt } = input

  if (runStatus === 'scheduled') {
    return { kind: 'empty' }
  }

  if (runStatus === 'ended') {
    return formatActual(endedAt, language)
  }

  const end = new Date(scheduledEndIso)
  if (Number.isNaN(end.getTime())) {
    return { kind: 'empty' }
  }

  const nowMs = now.getTime()
  if (nowMs < end.getTime()) {
    return dueDuration(end.getTime() - nowMs)
  }

  return delayedDuration(nowMs - end.getTime())
}
