import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { dashboardActions } from '@/features/dashboard/store'

const ENTITY_LINKS: { key: string; label: string; path: string }[] = [
  { key: 'tags', label: 'Tags', path: '/tags' },
  { key: 'units', label: 'Units', path: '/units' },
  { key: 'attributes', label: 'Attributes', path: '/attributes' },
  { key: 'products', label: 'Products', path: '/products' },
  { key: 'services', label: 'Services', path: '/services' },
  { key: 'spaces', label: 'Spaces', path: '/spaces' },
]

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { stats, status, error } = useAppSelector((s) => s.dashboard)
  const loading = status === 'loading' && !stats
  usePlatformLoading(loading ? 'Loading dashboard…' : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadStatsRequested())
  }, [accessToken, dispatch])

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage title="Dashboard" description="Catalog counts by verification status.">
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
                    <CardTitle className="text-base">{entity.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>Verified: {counts.verified}</p>
                    <p>Pending: {counts.pending}</p>
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
