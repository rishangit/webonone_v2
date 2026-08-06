import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { dashboardActions } from '@/features/dashboard/store'

const ENTITY_LINKS: { key: string; labelKey: string; path: string }[] = [
  { key: 'tags', labelKey: 'tags:title', path: '/tags' },
  { key: 'units', labelKey: 'units:title', path: '/units' },
  { key: 'attributes', labelKey: 'attributes:title', path: '/attributes' },
  { key: 'products', labelKey: 'products:title', path: '/products' },
  { key: 'services', labelKey: 'services:title', path: '/services' },
  { key: 'spaces', labelKey: 'spaces:title', path: '/spaces' },
]

export function DashboardPage() {
  const { t } = useTranslation('shell')
  const { t: tAny } = useTranslation()
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { stats, status, error } = useAppSelector((s) => s.dashboard)
  const loading = status === 'loading' && !stats
  usePlatformLoading(loading ? t('loadingDashboard') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadStatsRequested())
  }, [accessToken, dispatch])

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage title={t('dashboard')} description={t('dashboardDescription')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTITY_LINKS.map((entity) => {
            const counts = stats?.counts[entity.key] ?? { verified: 0, pending: 0 }
            return (
              <Link key={entity.key} to={entity.path} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tAny(entity.labelKey)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>{t('verifiedCount', { count: counts.verified })}</p>
                    <p>{t('unverifiedCount', { count: counts.pending })}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : null}
    </FeaturePage>
  )
}
