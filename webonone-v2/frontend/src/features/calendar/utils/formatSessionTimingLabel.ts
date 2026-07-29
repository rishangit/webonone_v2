export type SessionTimingKind = 'current' | 'upcoming' | 'ended'

export type SessionTimingLabel = {
  kind: SessionTimingKind
  label: string
}

const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

function formatUpcomingRemaining(msUntilStart: number): string {
  if (msUntilStart < MS_PER_HOUR) {
    const minutes = Math.max(1, Math.ceil(msUntilStart / MS_PER_MINUTE))
    return `${minutes} min`
  }
  if (msUntilStart < MS_PER_DAY) {
    const hours = Math.max(1, Math.ceil(msUntilStart / MS_PER_HOUR))
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  const days = Math.max(1, Math.ceil(msUntilStart / MS_PER_DAY))
  return days === 1 ? '1 day' : `${days} days`
}

/** Label for session list rows: Current, remaining until start, or Ended. */
export function formatSessionTimingLabel(
  startIso: string,
  endIso: string,
  now: Date = new Date(),
): SessionTimingLabel {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const nowMs = now.getTime()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { kind: 'ended', label: 'Ended' }
  }

  if (nowMs >= start.getTime() && nowMs < end.getTime()) {
    return { kind: 'current', label: 'Current' }
  }

  if (nowMs < start.getTime()) {
    return {
      kind: 'upcoming',
      label: formatUpcomingRemaining(start.getTime() - nowMs),
    }
  }

  return { kind: 'ended', label: 'Ended' }
}
