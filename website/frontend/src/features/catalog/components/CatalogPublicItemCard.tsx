import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  TagChip,
  cn,
} from '@webonone/ui-kit'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import { formatPublicListPrice } from '@/features/catalog/utils/formatPublicListPrice'
import {
  formatPublicServiceScheduleSummary,
  formatPublicServiceTimeModeLabel,
  resolvePublicServiceListPrice,
} from '@/features/catalog/utils/publicServiceListDisplay'

type CatalogPublicItemCardProps = {
  item: CatalogSearchItem
  className?: string
  companyDistanceLabel?: string | null
}

function CatalogCardCompanyRow({
  name,
  logoUrl,
  distanceLabel,
}: {
  name: string
  logoUrl?: string | null
  distanceLabel?: string | null
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ImagePreview
        src={logoUrl ?? null}
        alt=""
        mode="view"
        className="h-8 w-8 shrink-0 rounded-md"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{name}</p>
        {distanceLabel ? (
          <p className="truncate text-xs text-muted-foreground">{distanceLabel}</p>
        ) : null}
      </div>
    </div>
  )
}

function PublicServiceListMeta({
  item,
  className,
  showPrice = false,
}: {
  item: CatalogSearchItem
  className?: string
  showPrice?: boolean
}) {
  const { t } = useTranslation('catalog')
  const price = resolvePublicServiceListPrice(item)

  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5 text-sm', className)}>
      <span className="text-foreground">
        {formatPublicServiceTimeModeLabel(item.timeMode, t)}
      </span>
      <span className="text-muted-foreground">{formatPublicServiceScheduleSummary(item, t)}</span>
      {showPrice ? (
        <span className="font-medium tabular-nums text-foreground">
          {price != null ? formatPublicListPrice(price) : '—'}
        </span>
      ) : null}
    </div>
  )
}

function catalogCardDetails(item: CatalogSearchItem, refsLabel: string) {
  return (
    <div className="min-w-0 w-full flex-1">
      <div className="flex items-center gap-2">
        <p className="font-medium">{item.name}</p>
        <span className="text-xs text-muted-foreground">{refsLabel}</span>
      </div>
      {item.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {item.tags.slice(0, 3).map((tag) => (
          <TagChip key={tag.id} name={tag.name} color={tag.color ?? ''} />
        ))}
        {item.tags.length > 3 ? (
          <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
        ) : null}
      </div>
    </div>
  )
}

export function CatalogPublicItemCard({ item, className, companyDistanceLabel }: CatalogPublicItemCardProps) {
  const companyLogoUrl = item.companyImageUrl ?? null
  const navigate = useNavigate()
  const { t } = useTranslation('catalog')
  const detailPath = `/catalog/${item.kind}/${item.id}`
  const refsLabel = t('refs', { count: item.referenceCount ?? 0 })

  function openDetail() {
    navigate(detailPath)
  }

  const productPrice =
    item.kind === 'products' && item.listPrice != null ? formatPublicListPrice(item.listPrice) : null
  const servicePrice =
    item.kind === 'services' && item.listPrice != null ? formatPublicListPrice(item.listPrice) : null

  return (
    <ItemListCollectionCard
      className={cn(
        item.kind === 'products' || item.kind === 'services' ? 'h-full' : undefined,
        className,
      )}
      image={
        <ImagePreview
          src={item.imageUrl}
          alt={item.name}
          className={itemListCardImageClassName}
        />
      }
      onBodyClick={openDetail}
    >
      <div className="flex h-full min-h-[7.5rem] w-full flex-col items-stretch">
        {catalogCardDetails(item, refsLabel)}
        {item.kind === 'services' ? (
          <div className="flex w-full min-w-0 flex-1 flex-col items-stretch">
            <PublicServiceListMeta item={item} className="mt-2 flex-1" showPrice={false} />
          </div>
        ) : null}
        {item.kind === 'products' && productPrice ? (
          <p className="pt-2 text-right text-sm font-medium tabular-nums text-foreground">
            {productPrice}
          </p>
        ) : null}
        {item.kind === 'services' && servicePrice ? (
          <p className="pt-2 text-right text-sm font-medium tabular-nums text-foreground">
            {servicePrice}
          </p>
        ) : null}
        {item.companyName.trim() ? (
          <div className="mt-auto border-t border-border pt-2">
            <CatalogCardCompanyRow
              name={item.companyName}
              logoUrl={companyLogoUrl ?? null}
              distanceLabel={companyDistanceLabel}
            />
          </div>
        ) : null}
      </div>
    </ItemListCollectionCard>
  )
}
