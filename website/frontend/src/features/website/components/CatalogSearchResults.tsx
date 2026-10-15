import { useTranslation } from 'react-i18next'
import { ItemListEmpty } from '@webonone/ui-kit'
import { CatalogPublicItemCardGrid } from '@/features/catalog/components/CatalogPublicItemCardGrid'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import type { UserLocationStatus } from '@/features/website/hooks/useUserLocation'

type CatalogSearchResultsProps = {
  items: CatalogSearchItem[]
  searched: boolean
  error: string | null
  locationStatus: UserLocationStatus
}

export function CatalogSearchResults({
  items,
  searched,
  error,
  locationStatus,
}: CatalogSearchResultsProps) {
  const { t } = useTranslation('search')

  if (error) {
    return <ItemListEmpty>{error}</ItemListEmpty>
  }

  if (!searched) {
    return <ItemListEmpty>{t('searchHint')}</ItemListEmpty>
  }

  const rows = Array.isArray(items) ? items : []
  if (rows.length === 0) {
    return <ItemListEmpty>{t('noMatching')}</ItemListEmpty>
  }

  const locationNote =
    locationStatus === 'denied' || locationStatus === 'unavailable'
      ? t('locationUnavailableNote')
      : locationStatus === 'pending'
        ? t('locationPendingNote')
        : null

  return (
    <div className="flex flex-col gap-3">
      {locationNote ? (
        <p className="text-sm text-muted-foreground">{locationNote}</p>
      ) : null}
      <CatalogPublicItemCardGrid
        items={rows}
        distanceNamespace="search"
        className="gap-1 py-0 md:gap-3"
      />
    </div>
  )
}
