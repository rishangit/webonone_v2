import { useEffect, useMemo, useState } from 'react'
import { Redirect, useRouter, type Href } from 'expo-router'
import {
  FeatureScreen,
  FullCalendar,
  Spinner,
  type FullCalendarEvent,
  type FullCalendarView,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/features/auth/SessionContext'
import { ScheduleEventDetail, scheduleIssueSubtitle } from '@/features/calendar/components/ScheduleEventDetail'
import { scheduleChangeKindLabel } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'
import {
  canBrowseCalendar,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/calendar/utils/calendarAccess'
import { sessionDetailPath } from '@/features/calendar/utils/calendarPaths'
import { toYmd } from '@/features/calendar/utils/dateYmd'

function rangeForView(anchor: Date, view: FullCalendarView): { from: string; to: string } {
  if (view === 'day') {
    const ymd = toYmd(anchor)
    return { from: ymd, to: ymd }
  }
  if (view === 'week') {
    const start = new Date(anchor)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return { from: toYmd(start), to: toYmd(end) }
  }
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  const gridEnd = new Date(monthEnd)
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))
  return { from: toYmd(gridStart), to: toYmd(gridEnd) }
}

function occurrenceFromCalendarEvent(
  event: FullCalendarEvent,
  occurrences: CompanyEventOccurrence[],
): CompanyEventOccurrence | null {
  const separator = event.id.indexOf(':')
  if (separator <= 0) return null
  const eventId = event.id.slice(0, separator)
  const occurrenceDate = event.id.slice(separator + 1)
  if (!eventId || !occurrenceDate) return null
  return (
    occurrences.find((item) => item.id === eventId && item.occurrenceDate === occurrenceDate) ??
    null
  )
}

export function ScheduleScreen() {
  const { t } = useTranslation('calendar')
  const router = useRouter()
  const { user } = useSession()
  const [view, setView] = useState<FullCalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [occurrences, setOccurrences] = useState<CompanyEventOccurrence[]>([])
  const [loading, setLoading] = useState(true)

  const range = useMemo(() => rangeForView(anchorDate, view), [anchorDate, view])
  const personal = isPersonalCalendarSession(user?.role, user?.companyId)
  const canLoad = Boolean(user && canBrowseCalendar(user.role))
  const canManage = canManageCompanyEvents(user?.role, user?.companyId)

  const events = useMemo<FullCalendarEvent[]>(
    () =>
      occurrences.map((item) => {
        const kindLabel = scheduleChangeKindLabel(item.scheduleChangeKind)
        const issue = scheduleIssueSubtitle(item)
        return {
          id: `${item.id}:${item.occurrenceDate}`,
          title: kindLabel ? `${item.title} · ${kindLabel}` : item.title,
          start: new Date(item.start),
          end: new Date(item.end),
          imageUrl: item.serviceImageUrl,
          ...issue,
        }
      }),
    [occurrences],
  )

  useEffect(() => {
    if (!canLoad) {
      setOccurrences([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void eventsApi
      .listOccurrences(range.from, range.to)
      .then((items) => {
        if (cancelled) return
        setOccurrences(items)
      })
      .catch(() => {
        if (!cancelled) setOccurrences([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [canLoad, range.from, range.to])

  if (user && !canBrowseCalendar(user.role)) {
    return <Redirect href="/" />
  }

  const description = personal
    ? t('schedule.descriptionMember')
    : canManage
      ? t('schedule.descriptionAdmin')
      : t('schedule.descriptionStaff')

  return (
    <FeatureScreen title={t('schedule.title')} description={description}>
      {loading && occurrences.length === 0 ? <Spinner label={t('eventDetail.loading')} /> : null}
      <FullCalendar
        view={view}
        onViewChange={setView}
        anchorDate={anchorDate}
        onAnchorDateChange={setAnchorDate}
        events={events}
        renderEventPopover={(event, { close }) => {
          const occurrence = occurrenceFromCalendarEvent(event, occurrences)
          if (!occurrence) return null
          return (
            <ScheduleEventDetail
              occurrence={occurrence}
              onOpenSession={() => {
                close()
                router.push(sessionDetailPath(occurrence.id, occurrence.occurrenceDate) as Href)
              }}
            />
          )
        }}
        renderEventDetailPanelTitle={(event) => {
          const occurrence = occurrenceFromCalendarEvent(event, occurrences)
          return occurrence?.serviceName ?? 'Session'
        }}
      />
    </FeatureScreen>
  )
}
