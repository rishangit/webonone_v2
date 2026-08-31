import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FeaturePage,
  FullCalendar,
  type FullCalendarEvent,
  type FullCalendarView,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { ScheduleEventDetailPopover } from '@/features/calendar/components/ScheduleEventDetailPopover'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'
import {
  canAccessCompanySession,
  canBrowseCalendar,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/session/utils/canAccessCompanySession'
import { scheduleChangeKindLabel } from '@/features/calendar/components/SessionScheduleChangeMeta'

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

export function CalendarPage() {
  const { t } = useTranslation('calendar')
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const [view, setView] = useState<FullCalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [occurrences, setOccurrences] = useState<CompanyEventOccurrence[]>([])

  const range = useMemo(() => rangeForView(anchorDate, view), [anchorDate, view])
  const canLoadCompany = canAccessCompanySession(activeRole, activeCompanyId)
  const canLoadPersonal = isPersonalCalendarSession(activeRole, activeCompanyId)
  const canLoad = canLoadCompany || canLoadPersonal

  const events = useMemo<FullCalendarEvent[]>(
    () =>
      occurrences.map((item) => {
        const kindLabel = scheduleChangeKindLabel(item.scheduleChangeKind, t)
        const staffName = item.effectiveStaffDisplayName ?? item.staffDisplayName
        const issue =
          item.sessionIssue === 'staff_leave'
            ? {
                subtitle: t('schedule.issue.staffLeaveShort'),
                issueDetail: t('schedule.issue.staffLeaveDetail', { name: staffName }),
              }
            : item.sessionIssue === 'cancelled'
              ? {
                  subtitle: t('schedule.issue.cancelledShort'),
                  issueDetail: t('schedule.issue.cancelledDetail'),
                }
              : {}
        return {
          id: `${item.id}:${item.occurrenceDate}`,
          title: kindLabel ? `${item.title} · ${kindLabel}` : item.title,
          start: new Date(item.start),
          end: new Date(item.end),
          imageUrl: item.serviceImageUrl,
          ...issue,
        }
      }),
    [occurrences, t],
  )

  useEffect(() => {
    if (!canLoad) {
      setOccurrences([])
      return
    }
    let cancelled = false
    void eventsApi
      .listOccurrences(range.from, range.to)
      .then((items) => {
        if (cancelled) return
        setOccurrences(items)
      })
      .catch(() => {
        if (!cancelled) setOccurrences([])
      })
    return () => {
      cancelled = true
    }
  }, [range.from, range.to, canLoad])

  if (selectionComplete && !canBrowseCalendar(activeRole)) {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title={t('schedule.title')}
      description={
        canLoadPersonal
          ? t('schedule.descriptionMember')
          : canManageCompanyEvents(activeRole, activeCompanyId)
            ? t('schedule.descriptionAdmin')
            : t('schedule.descriptionStaff')
      }
      className="min-h-full"
    >
      <FullCalendar
        view={view}
        onViewChange={setView}
        anchorDate={anchorDate}
        onAnchorDateChange={setAnchorDate}
        events={events}
        renderEventPopover={(event, { close, presentation }) => {
          const occurrence = occurrenceFromCalendarEvent(event, occurrences)
          if (!occurrence) return null
          return (
            <ScheduleEventDetailPopover
              occurrence={occurrence}
              onClose={close}
              layout={presentation}
            />
          )
        }}
        renderEventDetailPanelTitle={(event) => {
          const occurrence = occurrenceFromCalendarEvent(event, occurrences)
          return occurrence?.serviceName ?? t('schedule.eventPreview.title')
        }}
        className="min-h-0"
      />
    </FeaturePage>
  )
}
