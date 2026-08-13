import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ImagePreview, ItemList, ItemListContent, ItemListEmpty, ItemListItem } from '@webonone/ui-kit'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import type { UserLocationStatus } from '@/features/website/hooks/useUserLocation'

function kindLabel(kind: CatalogSearchItem['kind'], t: (key: string) => string): string {
  if (kind === 'products') return t('product')
  if (kind === 'services') return t('service')
  return t('spaceKind')
}

function formatDistanceKm(distanceKm: number, t: (key: string, options?: Record<string, string>) => string): string {
  if (distanceKm < 1) {
    return t('metersAway', { meters: String(Math.round(distanceKm * 1000)) })
  }
  return t('kmAway', { km: distanceKm.toFixed(1) })
}

function hasMapLocation(item: CatalogSearchItem): boolean {
  return (
    item.latitude != null &&
    item.longitude != null &&
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude)
  )
}

type CatalogSearchResultsProps = {
  items: CatalogSearchItem[]
  searched: boolean
  error: string | null
  locationStatus: UserLocationStatus
  onViewInMap?: (item: CatalogSearchItem) => void
}

export function CatalogSearchResults({
  items,
  searched,
  error,
  locationStatus,
  onViewInMap,
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
      <ItemList>
        {rows.map((item) => {
          const mappable = hasMapLocation(item)
          const detailTo = `/catalog/${item.kind}/${item.id}`
          return (
            <ItemListItem key={`${item.kind}-${item.id}`}>
              <ItemListContent>
                <div className="flex items-start gap-3">
                  <Link
                    to={detailTo}
                    className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ImagePreview src={item.imageUrl} alt="" className="h-12 w-12" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={detailTo}
                        className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {kindLabel(item.kind, t)}
                          </span>
                          <span className="text-sm font-medium text-foreground hover:underline">
                            {item.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.companyName}</p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-3">
                        {mappable && onViewInMap ? (
                          <button
                            type="button"
                            className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onViewInMap(item)
                            }}
                          >
                            {t('viewInMap')}
                          </button>
                        ) : null}
                        {item.distanceKm != null ? (
                          <span className="rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">
                            {formatDistanceKm(item.distanceKm, t)}
                          </span>
                        ) : locationStatus === 'ready' && !mappable ? (
                          <span className="text-xs text-muted-foreground">{t('noMapPin')}</span>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      to={detailTo}
                      className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                      {item.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                              style={
                                tag.color ? { borderColor: tag.color, color: tag.color } : undefined
                              }
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </Link>
                  </div>
                </div>
              </ItemListContent>
            </ItemListItem>
          )
        })}
      </ItemList>
    </div>
  )
}
