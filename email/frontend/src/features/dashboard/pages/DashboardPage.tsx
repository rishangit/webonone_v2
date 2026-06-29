import { useEffect, useState } from 'react'
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
import { useAppSelector } from '@/app/store/hooks'
import { emailApi } from '@/shared/services/emailApi'
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
  const role = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await emailApi.getDashboardStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

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

      {loading ? <p className="text-sm text-muted-foreground">Loading dashboard…</p> : null}

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
