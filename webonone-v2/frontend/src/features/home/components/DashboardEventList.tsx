import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  RemainingTime,
  StatusTag,
  type StatusTagVariant,
} from '@webonone/ui-kit'
import type {
  CompanyEventOccurrence,
  SessionRunStatus,
} from '@/features/calendar/types/event.types'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { formatLocaleDate } from '@/shared/utils/formatLocaleDate'

type DashboardEventListProps = {
  items: CompanyEventOccurrence[]
  emptyMessage: string
  showDate?: boolean
}

const RUN_STATUS_VARIANT: Record<SessionRunStatus, StatusTagVariant> = {
  scheduled: 'pending',
  started: 'verified',
  ended: 'member',
}

function occurrenceMeta(item: CompanyEventOccurrence, t: ReturnType<typeof useTranslation>['t']) {
  if (item.attendeeDisplayName) {
    return t('metaWithAttendee', {
      staff: item.staffDisplayName,
      attendee: item.attendeeDisplayName,
    })
  }
  return t('staffName', { name: item.staffDisplayName })
}

function occurrenceRunStatus(item: CompanyEventOccurrence): SessionRunStatus {
  return item.runStatus ?? 'scheduled'
}

export function DashboardEventList({
  items,
  emptyMessage,
  showDate = false,
}: DashboardEventListProps) {
  const { t, i18n } = useTranslation('home')
  const { t: tCalendar } = useTranslation('calendar')
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  function openSession(item: CompanyEventOccurrence) {
    navigate(`/calendar/events/${item.id}/sessions/${item.occurrenceDate}`)
  }

  return (
    <ItemList>
      {items.map((item) => {
        const time = `${item.startTime}–${item.endTime}`
        const when = showDate
          ? `${formatLocaleDate(
              `${item.occurrenceDate}T12:00:00`,
              { year: 'numeric', month: 'short', day: 'numeric' },
              i18n.language,
            )} · ${time}`
          : time
        const runStatus = occurrenceRunStatus(item)

        return (
          <ItemListItem key={`${item.id}:${item.occurrenceDate}`}>
            <ItemListContent>
              <button
                type="button"
                className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openSession(item)}
              >
                <ImagePreview
                  src={item.serviceImageUrl}
                  alt={item.serviceName}
                  mode="view"
                  className="h-12 w-12"
                />
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-foreground">{item.serviceName}</p>
                  <p className="truncate text-xs text-muted-foreground">{occurrenceMeta(item, t)}</p>
                  <p className="truncate text-xs text-muted-foreground">{when}</p>
                  <SessionScheduleChangeMeta
                    scheduleChanged={item.scheduleChanged}
                    scheduleChangeKind={item.scheduleChangeKind}
                    originalStartTime={item.originalStartTime}
                    originalEndTime={item.originalEndTime}
                  />
                </div>
              </button>
            </ItemListContent>
            {!showDate ? (
              <StatusTag variant={RUN_STATUS_VARIANT[runStatus]} className="shrink-0 self-center">
                {tCalendar(`sessionStatus.${runStatus}`)}
              </StatusTag>
            ) : null}
            <RemainingTime
              start={item.start}
              end={item.end}
              now={now}
              runStatus={runStatus}
              labels={{
                ended: tCalendar('timing.ended'),
                due: tCalendar('timing.due'),
              }}
              appearance="plain"
            />
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
