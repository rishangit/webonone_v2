import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  FeaturePage,
  FullCalendar,
  type FullCalendarView,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'

export function CalendarPage() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const [view, setView] = useState<FullCalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())

  if (selectionComplete && activeRole !== 'company_admin') {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title="Calendar"
      description="View your company schedule by day, week, or month."
    >
      <FullCalendar
        view={view}
        onViewChange={setView}
        anchorDate={anchorDate}
        onAnchorDateChange={setAnchorDate}
        events={[]}
      />
    </FeaturePage>
  )
}
