import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ImagePreview,
  Spinner,
} from '@webonone/ui-kit'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { CatalogSearchItem, NearbyCompanyGroup } from '@/features/catalog/types/catalog.types'
import type { UserLocationCoords, UserLocationStatus } from '@/features/website/hooks/useUserLocation'

type NearbyHomeSectionProps = {
  coords: UserLocationCoords | null
  locationStatus: UserLocationStatus
}

function kindLabel(kind: CatalogSearchItem['kind'], t: (key: string) => string): string {
  if (kind === 'products') return t('product')
  if (kind === 'services') return t('service')
  return t('spaceKind')
}

function formatDistanceKm(
  distanceKm: number,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (distanceKm < 1) {
    return t('metersAway', { meters: String(Math.round(distanceKm * 1000)) })
  }
  return t('kmAway', { km: distanceKm.toFixed(1) })
}

export function NearbyHomeSection({ coords, locationStatus }: NearbyHomeSectionProps) {
  const { t } = useTranslation('home')
  const [companies, setCompanies] = useState<NearbyCompanyGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!coords) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void catalogApi
      .nearby({ lat: coords.lat, lng: coords.lng })
      .then((result) => {
        if (cancelled) return
        setCompanies(Array.isArray(result.companies) ? result.companies : [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCompanies([])
        setError(err instanceof Error ? err.message : t('nearbyFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [coords, t])

  if (!coords) {
    if (locationStatus === 'denied' || locationStatus === 'unavailable') {
      return <p className="text-sm text-muted-foreground">{t('nearbyNeedsLocation')}</p>
    }
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner size="sm" />
        <span>{t('nearbyLoading')}</span>
      </div>
    )
  }

  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner size="sm" />
        <span>{t('nearbyLoading')}</span>
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (companies.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('nearbyEmpty')}</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-sm font-medium text-muted-foreground">{t('nearbyHeading')}</h2>
      {companies.map((company) => (
        <section key={company.id} className="flex flex-col gap-3">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <ImagePreview
                src={company.imageUrl}
                alt=""
                mode="view"
                className="h-14 w-14 shrink-0 rounded-md"
              />
              <div className="min-w-0">
                <CardTitle className="text-base">{company.name}</CardTitle>
                <CardDescription>{formatDistanceKm(company.distanceKm, t)}</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {company.items.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                to={`/catalog/${item.kind}/${item.id}`}
                className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full overflow-hidden">
                  <ImagePreview
                    src={item.imageUrl}
                    alt=""
                    mode="view"
                    className="h-36 w-full rounded-none"
                  />
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      {kindLabel(item.kind, t)}
                    </p>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
