import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { formatRemainingDuration } from '../lib/formatRemainingDuration'

const remainingTimeVariants = cva(
  'inline-flex shrink-0 self-center items-center text-xs font-semibold tabular-nums',
  {
    variants: {
      appearance: {
        chip: 'rounded-md border px-2 py-0.5 backdrop-blur-sm',
        plain: 'border-0 bg-transparent px-0 py-0 font-medium',
      },
      kind: {
        upcoming: '',
        current: '',
        ended: '',
      },
    },
    compoundVariants: [
      {
        appearance: 'chip',
        kind: 'upcoming',
        className:
          'border-amber-600/55 bg-amber-500/15 text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-200',
      },
      {
        appearance: 'chip',
        kind: 'current',
        className:
          'border-emerald-600/55 bg-emerald-500/15 text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-200',
      },
      {
        appearance: 'chip',
        kind: 'ended',
        className: 'border-border/80 bg-muted/40 font-normal text-muted-foreground',
      },
      {
        appearance: 'plain',
        kind: 'upcoming',
        className: 'text-primary',
      },
      {
        appearance: 'plain',
        kind: 'current',
        className: 'text-primary',
      },
      {
        appearance: 'plain',
        kind: 'ended',
        className: 'font-normal text-muted-foreground',
      },
    ],
    defaultVariants: {
      appearance: 'chip',
      kind: 'upcoming',
    },
  },
)

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
  /** `chip` = bordered tag; `plain` = theme text only (no background/border). */
  appearance?: 'chip' | 'plain'
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

function RemainingTime({
  start,
  end,
  now,
  labels,
  appearance = 'chip',
  className,
}: RemainingTimeProps) {
  const timing = resolveRemainingTime(start, end, now, labels)

  return (
    <span
      className={cn(
        remainingTimeVariants({ appearance, kind: timing.kind }),
        className,
      )}
    >
      {timing.label}
    </span>
  )
}

export { RemainingTime }
