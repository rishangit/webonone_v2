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
import { PendingCompaniesList } from '@/features/home/components/PendingCompaniesList'
import {
  homeDashboardActions,
  selectPendingCompanies,
  selectTodayOccurrences,
  selectUpcomingOccurrences,
} from '@/features/home/store'
import {
  dashboardEventAudience,
  dashboardOccurrenceRange,
  dashboardSessionKey,
  type DashboardEventAudience,
} from '@/features/home/utils/dashboardRange'
import { SmsCreditsFrame } from '@/shared/components/sms'
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
  const { items, lastFetchedAt, error, companies, companiesLastFetchedAt, companiesError } =
    useAppSelector((s) => s.homeDashboard)

  const isSuperAdmin = activeRole === 'super_admin'
  const canBrowse = canBrowseCalendar(activeRole)
  const canViewSmsCredits = activeRole === 'company_admin'
  const audience = dashboardEventAudience(activeRole, activeCompanyId)
  const range = dashboardOccurrenceRange()
  const todayItems = selectTodayOccurrences(items, range.today)
  const upcomingItems = selectUpcomingOccurrences(items, range.today)
  const pendingCompanies = selectPendingCompanies(companies)
  const awaitingFirstLoad = canBrowse && lastFetchedAt === null && !error
  const awaitingCompanies = isSuperAdmin && companiesLastFetchedAt === null && !companiesError

  usePlatformLoading(awaitingFirstLoad || awaitingCompanies ? t('loading') : null)

  useEffect(() => {
    if (!selectionComplete || !isSuperAdmin) return
    dispatch(homeDashboardActions.loadCompaniesRequested())
  }, [selectionComplete, isSuperAdmin, dispatch])

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
      {error || (isSuperAdmin && companiesError) ? (
        <Alert variant="destructive">
          <AlertDescription>{error || companiesError}</AlertDescription>
        </Alert>
      ) : null}

      {isSuperAdmin ? (
        <Card variant="list">
          <CardHeader>
            <CardTitle className="text-lg">{t('pendingCompaniesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!awaitingCompanies ? <PendingCompaniesList items={pendingCompanies} /> : null}
          </CardContent>
        </Card>
      ) : null}

      {!isSuperAdmin && (audience || canViewSmsCredits) ? (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {audience ? (
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
          ) : null}
          <div
            className={`flex flex-col gap-6 lg:col-span-1${audience ? '' : ' lg:col-start-3'}`}
          >
            {canViewSmsCredits ? <SmsCreditsFrame /> : null}
            {audience ? (
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
            ) : null}
          </div>
        </div>
      ) : null}
    </FeaturePage>
  )
}
