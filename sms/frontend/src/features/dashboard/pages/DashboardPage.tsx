import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { dashboardActions } from '@/features/dashboard/store'

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

export function DashboardPage() {
  const { t } = useTranslation('shell')
  const { t: tq } = useTranslation('queue')
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { stats, status, error } = useAppSelector((s) => s.dashboard)

  const loading = status === 'loading' && !stats

  usePlatformLoading(loading ? t('loadingDashboard') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadStatsRequested())
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return (
    <FeaturePage title={t('dashboard')} description={t('dashboardDescription')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t('queuePending')} value={stats.pendingCount} />
            <StatCard title={t('failed24h')} value={stats.failedCount24h} />
            <StatCard title={t('sent24h')} value={stats.sentCount24h} />
            <StatCard title={t('approvedDevices')} value={stats.approvedDevices} />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">{t('historyTitle')}</h2>
            {stats.recentActivity.length === 0 ? (
              <ItemListEmpty>{tq('empty')}</ItemListEmpty>
            ) : (
              <ItemList>
                {stats.recentActivity.map((item) => (
                  <ItemListItem key={item.id}>
                    <ItemListContent>
                      <p className="font-medium">{item.toNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.templateSlug ?? tq('freeform')} ·{' '}
                        {item.status === 'sent' ? 'Sent' : 'Failed'}
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
