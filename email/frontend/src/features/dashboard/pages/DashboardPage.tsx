import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
  ListEmptyState,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LoadingState,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { PlatformHandoffSpinner, usePlatformHandoffPending } from '@/features/auth/components/PlatformHandoffSpinner'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { emailApi } from '@/shared/services/emailApi'
import { apiClient } from '@/shared/services/apiClient'
import type { DashboardStats, HistoryItem } from '@/shared/types/email.types'

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

function statusLabel(status: DashboardStats['recentActivity'][number]['status']): string {
  return status === 'sent' ? 'Sent' : 'Failed'
}

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString()
}

function endOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString()
}

export function DashboardPage() {
  const handoffPending = usePlatformHandoffPending()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)

  const role: EmailRole = user?.role ?? 'member'
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([])
  const [recentPage, setRecentPage] = useState(1)
  const [recentTotal, setRecentTotal] = useState(0)
  const [recentPageSize, setRecentPageSize] = useState(12)
  const [recentStatus, setRecentStatus] = useState<string>('all')
  const [recentFrom, setRecentFrom] = useState<Date | undefined>()
  const [recentTo, setRecentTo] = useState<Date | undefined>()
  const [filterOpen, setFilterOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const hasActiveFilters =
    recentStatus !== 'all' || recentFrom !== undefined || recentTo !== undefined

  useEffect(() => {
    if (!accessToken) {
      return
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const fromIso = recentFrom ? startOfDayIso(recentFrom) : undefined
        const toIso = recentTo ? endOfDayIso(recentTo) : undefined
        const [me, data, history] = await Promise.all([
          apiClient<{ user: { role: EmailRole } }>('/me'),
          emailApi.getDashboardStats(),
          emailApi.getHistory({
            page: recentPage,
            pageSize: recentPageSize,
            status: recentStatus === 'all' ? undefined : recentStatus,
            from: fromIso,
            to: toIso,
          }),
        ])
        dispatch(authActions.setUserRole(me.user.role))
        setStats(data)
        setRecentItems(history.items)
        setRecentTotal(history.total)
        setRecentPage(history.page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setStats(null)
        setRecentItems([])
        setRecentTotal(0)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [accessToken, dispatch, recentPage, recentPageSize, recentStatus, recentFrom, recentTo])

  if (handoffPending) {
    return <PlatformHandoffSpinner />
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  const isMember = role === 'member'

  function handleRecentPageChange(nextPage: number) {
    setRecentPage(nextPage)
  }

  function handleRecentPageSizeChange(nextSize: number) {
    setRecentPageSize(nextSize)
    setRecentPage(1)
  }

  function handleApplyFilters() {
    setRecentPage(1)
  }

  function handleClearFilters() {
    setRecentStatus('all')
    setRecentFrom(undefined)
    setRecentTo(undefined)
    setRecentPage(1)
  }

  const recentSectionActions = (
    <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
  )

  return (
    <FeaturePage
      title="Dashboard"
      description={
        isMember
          ? 'Your email activity overview.'
          : 'Email delivery summary and recent activity for your scope.'
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        <FormField label="Status" htmlFor="dashboard-recent-status">
          <Select value={recentStatus} onValueChange={setRecentStatus}>
            <SelectTrigger id="dashboard-recent-status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="From date" htmlFor="dashboard-recent-from">
          <DatePicker
            id="dashboard-recent-from"
            withIcon
            value={recentFrom}
            onChange={setRecentFrom}
            placeholder="Start date"
          />
        </FormField>

        <FormField label="To date" htmlFor="dashboard-recent-to">
          <DatePicker
            id="dashboard-recent-to"
            withIcon
            value={recentTo}
            onChange={setRecentTo}
            placeholder="End date"
          />
        </FormField>
      </ListFilterPanel>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingState overlay label="Loading dashboard…" /> : null}

      {!loading && stats ? (
        <>
          {isMember ? (
            <p className="text-sm text-muted-foreground">
              Limited dashboard view. Contact an administrator for send and template management.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Queue pending" value={stats.pendingCount} />
              <StatCard title="Failed (24h)" value={stats.failedCount24h} />
              <StatCard title="Sent (24h)" value={stats.sentCount24h} />
            </div>
          )}

          <section className="flex min-h-[calc(100dvh-24rem)] flex-col space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium">Recent activity</h2>
              {recentSectionActions}
            </div>
            <ListPageBody className="min-h-0 flex-1">
              <div className="flex-1">
                {recentItems.length === 0 ? (
                  <ListEmptyState
                    itemType="activity"
                    message={isMember ? 'No recent email activity.' : 'No sends yet for your scope.'}
                  />
                ) : (
                  <ItemList>
                    {recentItems.map((item) => (
                      <ItemListItem key={item.id}>
                        <ItemListContent>
                          <p className="font-medium">{item.recipient}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.templateSlug} · {statusLabel(item.status)}
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
