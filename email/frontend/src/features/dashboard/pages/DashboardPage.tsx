import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
  ItemListEmpty,
  ItemListItem,
  Pagination,
  Spinner,
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [me, data, history] = await Promise.all([
          apiClient<{ user: { role: EmailRole } }>('/me'),
          emailApi.getDashboardStats(),
          emailApi.getHistory({ page: recentPage, pageSize: recentPageSize }),
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
  }, [accessToken, dispatch, recentPage, recentPageSize])

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

  return (
    <FeaturePage
      title="Dashboard"
      description={
        isMember
          ? 'Your email activity overview.'
          : 'Email delivery summary and recent activity for your scope.'
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : null}

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

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Recent activity</h2>
            <div className="space-y-4">
              {recentItems.length === 0 ? (
                <ItemListEmpty>
                  {isMember ? 'No recent email activity.' : 'No sends yet for your scope.'}
                </ItemListEmpty>
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
              <Pagination
                totalCount={recentTotal}
                currentPage={recentPage}
                pageSize={recentPageSize}
                pageSizeOptions={[12, 24, 48]}
                onPageChange={handleRecentPageChange}
                onPageSizeChange={handleRecentPageSizeChange}
              />
            </div>
          </section>
        </>
      ) : null}
    </FeaturePage>
  )
}
