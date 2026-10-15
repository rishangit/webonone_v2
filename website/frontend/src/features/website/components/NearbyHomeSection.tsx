import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@webonone/ui-kit'
import { CatalogPublicItemCardGrid } from '@/features/catalog/components/CatalogPublicItemCardGrid'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { CatalogSearchItem, NearbyCompanyGroup } from '@/features/catalog/types/catalog.types'
import type { UserLocationCoords, UserLocationStatus } from '@/features/website/hooks/useUserLocation'

type NearbyHomeSectionProps = {
  coords: UserLocationCoords | null
  locationStatus: UserLocationStatus
}

export function NearbyHomeSection({ coords, locationStatus }: NearbyHomeSectionProps) {
  const { t } = useTranslation('home')
  const [companies, setCompanies] = useState<NearbyCompanyGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useMemo((): CatalogSearchItem[] => {
    const list: CatalogSearchItem[] = []
    for (const company of companies) {
      for (const item of company.items) {
        list.push({
          ...item,
          companyImageUrl: item.companyImageUrl ?? company.imageUrl,
        })
      }
    }
    return list
  }, [companies])

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

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('nearbyEmpty')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t('nearbyHeading')}</h2>
      <CatalogPublicItemCardGrid
        items={items}
        distanceNamespace="home"
        className="grid-cols-2 gap-1 py-0 sm:grid-cols-2 md:gap-3"
      />
    </div>
  )
}
