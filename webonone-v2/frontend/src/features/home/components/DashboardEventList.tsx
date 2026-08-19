import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  RemainingTime,
} from '@webonone/ui-kit'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'
import { formatLocaleDate } from '@/shared/utils/formatLocaleDate'

type DashboardEventListProps = {
  items: CompanyEventOccurrence[]
  emptyMessage: string
  showDate?: boolean
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
    if (showDate) return
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [showDate])

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
                </div>
              </button>
            </ItemListContent>
            {!showDate ? (
              <RemainingTime
                start={item.start}
                end={item.end}
                now={now}
                labels={{ ended: tCalendar('timing.ended') }}
              />
            ) : null}
            <ItemListMenu ariaLabel={t('actionsFor', { name: item.serviceName })}>
              <DropdownMenuItem onSelect={() => openSession(item)}>
                {t('viewDetails')}
              </DropdownMenuItem>
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
