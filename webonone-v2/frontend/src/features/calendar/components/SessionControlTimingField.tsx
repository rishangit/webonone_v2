import { cn } from '@webonone/ui-kit'
import type { TFunction } from 'i18next'
import type { SessionControlTimingDisplay } from '@/features/calendar/utils/sessionControlTiming'

type SessionControlTimingFieldProps = {
  label: string
  display: SessionControlTimingDisplay
  t: TFunction<'calendar'>
}

export function SessionControlTimingField({
  label,
  display,
  t,
}: SessionControlTimingFieldProps) {
  let value: string
  let valueClassName: string | undefined

  switch (display.kind) {
    case 'empty':
      value = '—'
      break
    case 'actual':
      value = display.text
      break
    case 'due':
      value = t('sessionDetail.controls.dueIn', { duration: display.duration })
      break
    case 'delayed':
      value = t('sessionDetail.controls.delayedBy', { duration: display.duration })
      valueClassName = 'text-destructive'
      break
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('text-sm text-foreground', valueClassName)}>{value}</p>
    </div>
  )
}
