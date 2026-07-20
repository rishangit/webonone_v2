import { useEffect } from 'react'
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
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import type { SmsRole } from '@/features/auth/types/auth.types'
import { dashboardActions } from '@/features/dashboard/store'
import type { DashboardStats } from '@/shared/types/sms.types'

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
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { stats, status, error } = useAppSelector((s) => s.dashboard)

  const role: SmsRole = user?.role ?? 'member'
  const isMember = role === 'member'
  const loading = status === 'loading' && !stats

  usePlatformLoading(loading ? 'Loading dashboard…' : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadStatsRequested())
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return (
    <FeaturePage
      title="Dashboard"
      description={
        isMember
          ? 'Your SMS activity overview.'
          : 'SMS delivery summary and recent activity for your scope.'
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && stats ? (
        <>
          {isMember ? (
            <p className="text-sm text-muted-foreground">
              Limited dashboard view. Contact an administrator for send and gateway management.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Queue pending" value={stats.pendingCount} />
              <StatCard title="Failed (24h)" value={stats.failedCount24h} />
              <StatCard title="Sent (24h)" value={stats.sentCount24h} />
              <StatCard title="Approved devices" value={stats.approvedDevices} />
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Recent activity</h2>
            {stats.recentActivity.length === 0 ? (
              <ItemListEmpty>No recent SMS activity for your scope.</ItemListEmpty>
            ) : (
              <ItemList>
                {stats.recentActivity.map((item) => (
                  <ItemListItem key={item.id}>
                    <ItemListContent>
                      <p className="font-medium">{item.toNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.templateSlug ?? 'freeform'} · {statusLabel(item.status)}
                        {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ''}
                      </p>
                    </ItemListContent>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </section>
        </>
      ) : null}
    </FeaturePage>
  )
}
