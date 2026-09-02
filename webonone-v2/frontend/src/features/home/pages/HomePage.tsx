import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { canBrowseCalendar } from '@/features/session/utils/canAccessCompanySession'
import { DashboardEventList } from '@/features/home/components/DashboardEventList'
import {
  homeDashboardActions,
  selectTodayOccurrences,
  selectUpcomingOccurrences,
} from '@/features/home/store'
import {
  dashboardEventAudience,
  dashboardOccurrenceRange,
  dashboardSessionKey,
  type DashboardEventAudience,
} from '@/features/home/utils/dashboardRange'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

function emptyTodayKey(
  audience: DashboardEventAudience,
): 'emptyTodayAdmin' | 'emptyTodayStaff' | 'emptyTodayMember' {
  if (audience === 'admin') return 'emptyTodayAdmin'
  if (audience === 'staff') return 'emptyTodayStaff'
  return 'emptyTodayMember'
}

function emptyUpcomingKey(
  audience: DashboardEventAudience,
): 'emptyUpcomingAdmin' | 'emptyUpcomingStaff' | 'emptyUpcomingMember' {
  if (audience === 'admin') return 'emptyUpcomingAdmin'
  if (audience === 'staff') return 'emptyUpcomingStaff'
  return 'emptyUpcomingMember'
}

export function HomePage() {
  const { t, i18n } = useTranslation('home')
  const dispatch = useAppDispatch()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const { items, lastFetchedAt, error } = useAppSelector((s) => s.homeDashboard)

  const canBrowse = canBrowseCalendar(activeRole)
  const audience = dashboardEventAudience(activeRole, activeCompanyId)
  const range = dashboardOccurrenceRange()
  const todayItems = selectTodayOccurrences(items, range.today)
  const upcomingItems = selectUpcomingOccurrences(items, range.today)
  const awaitingFirstLoad = canBrowse && lastFetchedAt === null && !error

  usePlatformLoading(awaitingFirstLoad ? t('loading') : null)

  useEffect(() => {
    if (!selectionComplete || !canBrowse) return
    dispatch(
      homeDashboardActions.loadRequested({
        from: range.from,
        to: range.to,
        sessionKey: dashboardSessionKey(activeRole, activeCompanyId),
      }),
    )
  }, [
    selectionComplete,
    canBrowse,
    activeRole,
    activeCompanyId,
    range.from,
    range.to,
    dispatch,
  ])

  return (
    <FeaturePage title={t('pageTitle')} description={t('pageDescription')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {audience ? (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card variant="list">
              <CardHeader>
                <CardTitle className="text-lg">{t('todayTitle')}</CardTitle>
                <CardDescription>{formatCalendarYmd(range.today, i18n.language)}</CardDescription>
              </CardHeader>
              <CardContent>
                {!awaitingFirstLoad ? (
                  <DashboardEventList
                    items={todayItems}
                    emptyMessage={t(emptyTodayKey(audience))}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card variant="list">
              <CardHeader>
                <CardTitle className="text-lg">{t('upcomingTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {!awaitingFirstLoad ? (
                  <DashboardEventList
                    items={upcomingItems}
                    emptyMessage={t(emptyUpcomingKey(audience))}
                    showDate
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </FeaturePage>
  )
}
