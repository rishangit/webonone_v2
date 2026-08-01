import { Link } from 'react-router-dom'
import { ItemList, ItemListContent, ItemListEmpty, ItemListItem } from '@webonone/ui-kit'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import type { UserLocationStatus } from '@/features/website/hooks/useUserLocation'

const KIND_LABEL: Record<CatalogSearchItem['kind'], string> = {
  products: 'Product',
  services: 'Service',
  spaces: 'Space',
}

function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km away`
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
  if (error) {
    return <ItemListEmpty>{error}</ItemListEmpty>
  }

  if (!searched) {
    return (
      <ItemListEmpty>Search products, services, and spaces from companies on WebOnOne.</ItemListEmpty>
    )
  }

  const rows = Array.isArray(items) ? items : []
  if (rows.length === 0) {
    return <ItemListEmpty>No matching offerings found. Try another search.</ItemListEmpty>
  }

  const locationNote =
    locationStatus === 'denied' || locationStatus === 'unavailable'
      ? 'Location unavailable — results are sorted by name. Enable location above to see distance.'
      : locationStatus === 'pending'
        ? 'Detecting your location… distances appear when ready.'
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
                <div className="flex items-start justify-between gap-3">
                  <Link to={detailTo} className="min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {KIND_LABEL[item.kind]}
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
                        View in map
                      </button>
                    ) : null}
                    {item.distanceKm != null ? (
                      <span className="rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">
                        {formatDistanceKm(item.distanceKm)}
                      </span>
                    ) : locationStatus === 'ready' && !mappable ? (
                      <span className="text-xs text-muted-foreground">No map pin</span>
                    ) : null}
                  </div>
                </div>
                <Link to={detailTo} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                          style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              </ItemListContent>
            </ItemListItem>
          )
        })}
      </ItemList>
    </div>
  )
}
