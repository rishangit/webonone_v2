import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle, FeaturePage, Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { PlatformHandoffSpinner, usePlatformHandoffPending } from '@/features/auth/components/PlatformHandoffSpinner'
import { dataApi } from '@/shared/services/dataApi'
import type { DashboardStats } from '@/shared/types/data.types'

const ENTITY_LINKS: { key: string; label: string; path: string }[] = [
  { key: 'tags', label: 'Tags', path: '/tags' },
  { key: 'units', label: 'Units', path: '/units' },
  { key: 'attributes', label: 'Attributes', path: '/attributes' },
  { key: 'products', label: 'Products', path: '/products' },
  { key: 'services', label: 'Services', path: '/services' },
  { key: 'spaces', label: 'Spaces', path: '/spaces' },
]

export function DashboardPage() {
  const handoffPending = usePlatformHandoffPending()
  const { accessToken } = useAppSelector((s) => s.auth)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    dataApi
      .getDashboardStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [accessToken])

  if (handoffPending) return <PlatformHandoffSpinner />
  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage title="Dashboard" description="Catalog counts by verification status.">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
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
      )}
    </FeaturePage>
  )
}
