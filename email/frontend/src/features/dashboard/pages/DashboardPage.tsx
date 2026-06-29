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
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { emailApi } from '@/shared/services/emailApi'
import { apiClient } from '@/shared/services/apiClient'
import type { DashboardStats } from '@/shared/types/email.types'

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

  const role: EmailRole = user?.role ?? 'member'
  const [stats, setStats] = useState<DashboardStats | null>(null)
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
        const [me, data] = await Promise.all([
          apiClient<{ user: { role: EmailRole } }>('/me'),
          emailApi.getDashboardStats(),
        ])
        dispatch(authActions.setUserRole(me.user.role))
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  const isMember = role === 'member'
  const recent = stats?.recentActivity ?? []

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
            {recent.length === 0 ? (
              <ItemListEmpty>
                {isMember ? 'No recent email activity.' : 'No sends yet for your scope.'}
              </ItemListEmpty>
            ) : (
              <ItemList>
                {recent.map((item) => (
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
          </section>
        </>
      ) : null}
    </FeaturePage>
  )
}
