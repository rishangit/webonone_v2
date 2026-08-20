import { useTranslation } from 'react-i18next'
import { StatusTag } from '@webonone/ui-kit'
import type { SessionScheduleChangeKind } from '../types/event.types'

export type SessionScheduleChangeMetaProps = {
  scheduleChanged?: boolean
  scheduleChangeKind?: SessionScheduleChangeKind | null
  originalStartTime?: string | null
  originalEndTime?: string | null
  className?: string
}

export function SessionScheduleChangeMeta({
  scheduleChanged,
  scheduleChangeKind,
  originalStartTime,
  originalEndTime,
  className,
}: SessionScheduleChangeMetaProps) {
  const { t } = useTranslation('calendar')

  if (!scheduleChanged || !scheduleChangeKind) return null

  const kindLabel =
    scheduleChangeKind === 'early'
      ? t('sessionStatus.early')
      : t('sessionStatus.delayed')

  return (
    <div className={className ?? 'mt-1 space-y-1'}>
      {originalStartTime && originalEndTime ? (
        <p className="truncate text-xs text-muted-foreground">
          {t('session.wasTime', {
            start: originalStartTime,
            end: originalEndTime,
          })}
        </p>
      ) : null}
      <StatusTag variant="pending">{kindLabel}</StatusTag>
    </div>
  )
}

export function scheduleChangeKindLabel(
  kind: SessionScheduleChangeKind | null | undefined,
  t: (key: string) => string,
): string | null {
  if (kind === 'delayed') return t('sessionStatus.delayed')
  if (kind === 'early') return t('sessionStatus.early')
  return null
}
