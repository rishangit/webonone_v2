import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  FeaturePage,
  FormField,
  ItemList,
  ItemListContent,
  ItemListItem,
  ItemListEmpty,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { dashboardActions } from '@/features/dashboard/store'
import { historyActions } from '@/features/history/store'
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString()
}

function endOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString()
}

export function DashboardPage() {
  const { t } = useTranslation('shell')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { stats, status: statsStatus, error: statsError } = useAppSelector((s) => s.dashboard)
  const {
    items: recentItems,
    total: recentTotal,
    page: recentPage,
    pageSize: recentPageSize,
    listStatus: recentListStatus,
    listError: recentListError,
  } = useAppSelector((s) => s.history)

  const role: EmailRole = user?.role ?? 'member'
  const [recentStatus, setRecentStatus] = useState<string>('all')
  const [recentFrom, setRecentFrom] = useState<Date | undefined>()
  const [recentTo, setRecentTo] = useState<Date | undefined>()
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
  })

  const loading =
    (statsStatus === 'loading' && !stats) || (recentListStatus === 'loading' && recentItems.length === 0)
  const error = statsError ?? recentListError

  usePlatformLoading(loading ? t('loadingDashboard') : null)

  const hasActiveFilters =
    appliedFilters.status !== 'all' ||
    appliedFilters.from !== undefined ||
    appliedFilters.to !== undefined

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadStatsRequested())
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!accessToken) return
    const fromIso = appliedFilters.from ? startOfDayIso(appliedFilters.from) : undefined
    const toIso = appliedFilters.to ? endOfDayIso(appliedFilters.to) : undefined
    dispatch(
      historyActions.loadListRequested({
        page: recentPage,
        pageSize: recentPageSize,
        status: appliedFilters.status,
        extra: { from: fromIso, to: toIso },
      }),
    )
  }, [accessToken, appliedFilters, dispatch, recentPage, recentPageSize])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  const isMember = role === 'member'

  function handleRecentPageChange(nextPage: number) {
    dispatch(
      historyActions.loadListRequested({
        page: nextPage,
        pageSize: recentPageSize,
        status: appliedFilters.status,
        extra: {
          from: appliedFilters.from ? startOfDayIso(appliedFilters.from) : undefined,
          to: appliedFilters.to ? endOfDayIso(appliedFilters.to) : undefined,
        },
      }),
    )
  }

  function handleRecentPageSizeChange(nextSize: number) {
    dispatch(
      historyActions.loadListRequested({
        page: 1,
        pageSize: nextSize,
        status: appliedFilters.status,
        extra: {
          from: appliedFilters.from ? startOfDayIso(appliedFilters.from) : undefined,
          to: appliedFilters.to ? endOfDayIso(appliedFilters.to) : undefined,
        },
      }),
    )
  }

  function handleApplyFilters() {
    setAppliedFilters({ status: recentStatus, from: recentFrom, to: recentTo })
    dispatch(
      historyActions.loadListRequested({
        page: 1,
        pageSize: recentPageSize,
        status: recentStatus,
        extra: {
          from: recentFrom ? startOfDayIso(recentFrom) : undefined,
          to: recentTo ? endOfDayIso(recentTo) : undefined,
        },
      }),
    )
  }

  function handleClearFilters() {
    setRecentStatus('all')
    setRecentFrom(undefined)
    setRecentTo(undefined)
    setAppliedFilters({ status: 'all', from: undefined, to: undefined })
    dispatch(
      historyActions.loadListRequested({
        page: 1,
        pageSize: recentPageSize,
        status: 'all',
      }),
    )
  }

  const recentSectionActions = (
    <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
  )

  return (
    <FeaturePage
      title={t('dashboard')}
      description={isMember ? t('dashboardDescriptionMember') : t('dashboardDescription')}
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        <FormField label={tc('status')} htmlFor="dashboard-recent-status">
          <Select value={recentStatus} onValueChange={setRecentStatus}>
            <SelectTrigger id="dashboard-recent-status">
              <SelectValue placeholder={t('allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              <SelectItem value="sent">{t('statusSent')}</SelectItem>
              <SelectItem value="failed">{t('statusFailed')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={t('fromDate')} htmlFor="dashboard-recent-from">
          <DatePicker
            id="dashboard-recent-from"
            withIcon
            value={recentFrom}
            onChange={setRecentFrom}
            placeholder={t('startDate')}
          />
        </FormField>

        <FormField label={t('toDate')} htmlFor="dashboard-recent-to">
          <DatePicker
            id="dashboard-recent-to"
            withIcon
            value={recentTo}
            onChange={setRecentTo}
            placeholder={t('endDate')}
          />
        </FormField>
      </ListFilterPanel>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && stats ? (
        <>
          {isMember ? (
            <p className="text-sm text-muted-foreground">{t('memberLimited')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title={t('queuePending')} value={stats.pendingCount} />
              <StatCard title={t('failed24h')} value={stats.failedCount24h} />
              <StatCard title={t('sent24h')} value={stats.sentCount24h} />
            </div>
          )}

          <section className="flex min-h-[calc(100dvh-24rem)] flex-col space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium">{t('recentActivity')}</h2>
              {recentSectionActions}
            </div>
            <ListPageBody className="min-h-0 flex-1">
              <div className="flex-1">
                {recentItems.length === 0 ? (
                  <ItemListEmpty>{isMember ? t('noRecentMember') : t('noRecent')}</ItemListEmpty>
                ) : (
                  <ItemList>
                    {recentItems.map((item) => (
                      <ItemListItem key={item.id}>
                        <ItemListContent>
                          <p className="font-medium">{item.recipient}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.templateSlug} ·{' '}
                            {item.status === 'sent' ? t('statusSent') : t('statusFailed')}
                            {item.sentAt ? ` · ${new Date(item.sentAt).toLocaleString()}` : ''}
                          </p>
                        </ItemListContent>
                      </ItemListItem>
                    ))}
                  </ItemList>
                )}
              </div>
              <Pagination
                className="mt-auto"
                totalCount={recentTotal}
                currentPage={recentPage}
                pageSize={recentPageSize}
                pageSizeOptions={[12, 24, 48]}
                onPageChange={handleRecentPageChange}
                onPageSizeChange={handleRecentPageSizeChange}
              />
            </ListPageBody>
          </section>
        </>
      ) : null}
    </FeaturePage>
  )
}
