import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  FeaturePage,
  FullCalendar,
  type FullCalendarEvent,
  type FullCalendarView,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'

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

export function CalendarPage() {
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const [view, setView] = useState<FullCalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [events, setEvents] = useState<FullCalendarEvent[]>([])

  const range = useMemo(() => rangeForView(anchorDate, view), [anchorDate, view])
  const canAccess = canAccessCompanySession(activeRole, activeCompanyId)

  useEffect(() => {
    if (selectionComplete && !canAccess) return
    let cancelled = false
    void eventsApi
      .listOccurrences(range.from, range.to)
      .then((occurrences) => {
        if (cancelled) return
        setEvents(
          occurrences.map((item) => ({
            id: `${item.id}:${item.occurrenceDate}`,
            title: item.title,
            start: new Date(item.start),
            end: new Date(item.end),
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
    return () => {
      cancelled = true
    }
  }, [range.from, range.to, canAccess, selectionComplete])

  if (selectionComplete && !canAccess) {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title="Schedule"
      description="View your company schedule by day, week, or month."
      className="min-h-full"
    >
      <FullCalendar
        view={view}
        onViewChange={setView}
        anchorDate={anchorDate}
        onAnchorDateChange={setAnchorDate}
        events={events}
        onEventClick={(event) => {
          const separator = event.id.indexOf(':')
          if (separator <= 0) return
          const eventId = event.id.slice(0, separator)
          const occurrenceDate = event.id.slice(separator + 1)
          if (eventId && occurrenceDate) {
            navigate(`/calendar/events/${eventId}/sessions/${occurrenceDate}`)
          }
        }}
        className="min-h-0"
      />
    </FeaturePage>
  )
}
