import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CatalogRatingSummary,
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  TagChip,
  cn,
  PriceDisplay,
} from '@webonone/ui-kit'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
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
      <p className="min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground">{name}</p>
      {distanceLabel ? (
        <p className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">{distanceLabel}</p>
      ) : null}
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
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span className="shrink-0 text-foreground">
          {formatPublicServiceTimeModeLabel(item.timeMode, t)}
        </span>
        <span className="min-w-0 text-muted-foreground">
          {formatPublicServiceScheduleSummary(item, t)}
        </span>
      </div>
      {showPrice ? (
        <PriceDisplay
          value={price}
          compareAt={item.listPriceCompareAt}
          discountPercent={item.listDiscountPercent}
          size="sm"
        />
      ) : null}
    </div>
  )
}

function CatalogCardTags({ tags }: { tags: CatalogSearchItem['tags'] }) {
  if (tags.length === 0) return null

  return (
    <div
      className="flex min-w-0 flex-nowrap gap-1 overflow-x-auto md:flex-wrap md:overflow-x-visible"
      onClick={(event) => event.stopPropagation()}
    >
      {tags.map((tag, index) => (
        <TagChip
          key={tag.id}
          name={tag.name}
          color={tag.color ?? ''}
          className={cn('shrink-0', index >= 3 && 'md:hidden')}
        />
      ))}
      {tags.length > 3 ? (
        <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
          +{tags.length - 3}
        </span>
      ) : null}
    </div>
  )
}

function catalogCardDetails(
  item: CatalogSearchItem,
  ratingRow: ReactNode,
) {
  return (
    <div className="min-w-0 w-full flex-1">
      <p className="font-medium">{item.name}</p>
      {item.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      ) : null}
      {ratingRow}
      <CatalogCardTags tags={item.tags} />
    </div>
  )
}

export function CatalogPublicItemCard({ item, className, companyDistanceLabel }: CatalogPublicItemCardProps) {
  const companyLogoUrl = item.companyImageUrl ?? null
  const navigate = useNavigate()
  const { t } = useTranslation('search')
  const detailPath = `/catalog/${item.kind}/${item.id}`

  function openDetail() {
    navigate(detailPath)
  }

  const showCompany = item.companyName.trim().length > 0
  const showPrice =
    (item.kind === 'products' || item.kind === 'services') && item.listPrice != null
  const reviewSummary = item.reviewSummary
  const ratingRow =
    reviewSummary && reviewSummary.count > 0 ? (
      <CatalogRatingSummary
        className="mt-1"
        averageRating={reviewSummary.averageRating}
        reviewCount={reviewSummary.count}
        countLabel={t('reviewsListRatingCount', { count: reviewSummary.count })}
        ratingLabel={t('reviewsRatingLabel')}
      />
    ) : null

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
        {catalogCardDetails(item, ratingRow)}
        {item.kind === 'services' ? (
          <div className="flex w-full min-w-0 flex-1 flex-col items-stretch">
            <PublicServiceListMeta item={item} className="mt-2 flex-1" showPrice={false} />
          </div>
        ) : null}
        {showCompany || showPrice ? (
          <div className="mt-auto flex w-full min-w-0 flex-col gap-1 pt-2">
            {showCompany ? (
              <CatalogCardCompanyRow
                name={item.companyName}
                logoUrl={companyLogoUrl ?? null}
                distanceLabel={companyDistanceLabel}
              />
            ) : null}
            {showPrice ? (
              <PriceDisplay
                value={item.listPrice}
                compareAt={item.kind === 'services' ? item.listPriceCompareAt : null}
                discountPercent={item.kind === 'services' ? item.listDiscountPercent : null}
                size="sm"
                align="right"
                className="w-full"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </ItemListCollectionCard>
  )
}
