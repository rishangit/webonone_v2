import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListItem,
  ItemListEmpty,
  ListFilterTrigger,
  ListPageBody,
  ListPageFooter,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { dashboardActions } from '@/features/dashboard/store'
import { historyActions } from '@/features/history/store'
import { EmailDeliveryStatusDateFilterFields } from '@/shared/components/EmailDeliveryStatusDateFilterFields'
import type { EmailDeliveryStatusDateFilterDraft } from '@/shared/types/filterDrafts'
import { parseFilterDate, serializeFilterDate } from '@/shared/types/filterDrafts'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'
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
        page: 1,
        pageSize: recentPageSize,
        status: appliedFilters.status,
        extra: { from: fromIso, to: toIso },
      }),
    )
  }, [accessToken, appliedFilters, dispatch, recentPageSize])

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

  function applyFilters(draft?: EmailDeliveryStatusDateFilterDraft) {
    const nextStatus = draft?.status ?? recentStatus
    const nextFrom = draft ? parseFilterDate(draft.from) : recentFrom
    const nextTo = draft ? parseFilterDate(draft.to) : recentTo
    setRecentStatus(nextStatus)
    setRecentFrom(nextFrom)
    setRecentTo(nextTo)
    setAppliedFilters({ status: nextStatus, from: nextFrom, to: nextTo })
    dispatch(
      historyActions.loadListRequested({
        page: 1,
        pageSize: recentPageSize,
        status: nextStatus,
        extra: {
          from: nextFrom ? startOfDayIso(nextFrom) : undefined,
          to: nextTo ? endOfDayIso(nextTo) : undefined,
        },
      }),
    )
  }

  function handleApplyFilters(draft?: EmailDeliveryStatusDateFilterDraft) {
    applyFilters(draft)
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
      <PlatformHostedListFilterPanel<EmailDeliveryStatusDateFilterDraft>
        path="/embed/panels/dashboard/filters"
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={{
          status: recentStatus,
          from: serializeFilterDate(recentFrom),
          to: serializeFilterDate(recentTo),
        }}
        onDraftApply={(draft) => {
          setRecentStatus(draft.status)
          setRecentFrom(parseFilterDate(draft.from))
          setRecentTo(parseFilterDate(draft.to))
        }}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <EmailDeliveryStatusDateFilterFields
          idPrefix="dashboard-recent"
          status={recentStatus}
          onStatusChange={setRecentStatus}
          from={recentFrom}
          onFromChange={setRecentFrom}
          to={recentTo}
          onToChange={setRecentTo}
        />
      </PlatformHostedListFilterPanel>

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
                            {item.sentAt ? ` · ${formatDisplayDateTime(item.sentAt)}` : ''}
                          </p>
                        </ItemListContent>
                      </ItemListItem>
                    ))}
                  </ItemList>
                )}
              </div>
              <ListPageFooter
                className="mt-auto"
                totalCount={recentTotal}
                currentPage={recentPage}
                pageSize={recentPageSize}
                pageSizeOptions={[12, 24, 48]}
                loadedCount={recentItems.length}
                hasMore={recentItems.length < recentTotal}
                loadingMore={recentListStatus === 'loading' && recentItems.length > 0}
                onPageChange={handleRecentPageChange}
                onPageSizeChange={handleRecentPageSizeChange}
                onLoadMore={() =>
                  dispatch(
                    historyActions.loadListRequested({
                      page: recentPage + 1,
                      pageSize: recentPageSize,
                      status: appliedFilters.status,
                      append: true,
                      extra: {
                        from: appliedFilters.from ? startOfDayIso(appliedFilters.from) : undefined,
                        to: appliedFilters.to ? endOfDayIso(appliedFilters.to) : undefined,
                      },
                    }),
                  )
                }
                onModeChange={() =>
                  dispatch(
                    historyActions.loadListRequested({
                      page: 1,
                      pageSize: recentPageSize,
                      status: appliedFilters.status,
                      force: true,
                      extra: {
                        from: appliedFilters.from ? startOfDayIso(appliedFilters.from) : undefined,
                        to: appliedFilters.to ? endOfDayIso(appliedFilters.to) : undefined,
                      },
                    }),
                  )
                }
              />
            </ListPageBody>
          </section>
        </>
      ) : null}
    </FeaturePage>
  )
}
