import { useTranslation } from 'react-i18next'
import { ItemListCardGrid } from '@webonone/ui-kit'
import { CatalogPublicItemCard } from '@/features/catalog/components/CatalogPublicItemCard'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import { formatCatalogDistanceKm } from '@/features/catalog/utils/formatCatalogDistance'

type DistanceNamespace = 'home' | 'search'

type CatalogPublicItemCardGridProps = {
  items: CatalogSearchItem[]
  className?: string
  /** Locale keys for distance (`metersAway` / `kmAway`) — same strings in `home` and `search`. */
  distanceNamespace?: DistanceNamespace
}

export function CatalogPublicItemCardGrid({
  items,
  className,
  distanceNamespace = 'search',
}: CatalogPublicItemCardGridProps) {
  const { t } = useTranslation(distanceNamespace)

  return (
    <ItemListCardGrid className={className ?? 'py-0'}>
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="min-w-0 list-none">
          <CatalogPublicItemCard
            item={item}
            companyDistanceLabel={
              item.distanceKm != null ? formatCatalogDistanceKm(item.distanceKm, t) : null
            }
          />
        </li>
      ))}
    </ItemListCardGrid>
  )
}
