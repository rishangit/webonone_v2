import { useEffect, useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import {
  Alert,
  AlertDescription,
  Card,
  FeatureScreen,
  Muted,
  Spinner,
  Subheading,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/features/auth/SessionContext'
import { DashboardEventList } from '@/features/home/components/DashboardEventList'
import {
  dashboardEventAudience,
  dashboardOccurrenceRange,
  selectTodayOccurrences,
  selectUpcomingOccurrences,
  type DashboardEventAudience,
} from '@/features/home/utils/dashboardRange'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'
import { canBrowseCalendar } from '@/features/calendar/utils/calendarAccess'
import { sessionDetailPath } from '@/features/calendar/utils/calendarPaths'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

function emptyTodayMessage(audience: DashboardEventAudience, t: (key: string) => string): string {
  if (audience === 'admin') return t('emptyTodayAdmin')
  if (audience === 'staff') return t('emptyTodayStaff')
  return t('emptyTodayMember')
}

function emptyUpcomingMessage(audience: DashboardEventAudience, t: (key: string) => string): string {
  if (audience === 'admin') return t('emptyUpcomingAdmin')
  if (audience === 'staff') return t('emptyUpcomingStaff')
  return t('emptyUpcomingMember')
}

export function DashboardScreen() {
  const { t } = useTranslation('home')
  const router = useRouter()
  const { user } = useSession()
  const canBrowse = canBrowseCalendar(user?.role)
  const audience = dashboardEventAudience(user?.role, user?.companyId)
  const range = dashboardOccurrenceRange()
  const [items, setItems] = useState<CompanyEventOccurrence[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null)
  const awaitingFirstLoad = canBrowse && lastFetchedAt === null && !error

  useEffect(() => {
    if (!canBrowse) {
      setItems([])
      setError(null)
      setLastFetchedAt(null)
      return
    }
    let active = true
    setItems([])
    setError(null)
    setLastFetchedAt(null)
    void eventsApi
      .listOccurrences(range.from, range.to)
      .then((data) => {
        if (!active) return
        setItems(data)
        setLastFetchedAt(Date.now())
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : t('loading'))
        setLastFetchedAt(null)
      })
    return () => {
      active = false
    }
  }, [canBrowse, range.from, range.to, user?.role, user?.companyId])

  const todayItems = selectTodayOccurrences(items, range.today)
  const upcomingItems = selectUpcomingOccurrences(items, range.today)

  function openSession(item: CompanyEventOccurrence) {
    router.push(sessionDetailPath(item.id, item.occurrenceDate) as Href)
  }

  return (
    <FeatureScreen title={t('pageTitle')} description={t('pageDescription')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {awaitingFirstLoad ? <Spinner label={t('loading')} /> : null}

      {audience && !awaitingFirstLoad ? (
        <>
          <Card className="gap-2">
            <Subheading>{t('todayTitle')}</Subheading>
            <Muted>{formatCalendarYmd(range.today)}</Muted>
            <DashboardEventList
              items={todayItems}
              emptyMessage={emptyTodayMessage(audience, t)}
              onOpen={openSession}
            />
          </Card>
          <Card className="gap-2">
            <Subheading>{t('upcomingTitle')}</Subheading>
            <DashboardEventList
              items={upcomingItems}
              emptyMessage={emptyUpcomingMessage(audience, t)}
              showDate
              onOpen={openSession}
            />
          </Card>
        </>
      ) : null}
    </FeatureScreen>
  )
}
