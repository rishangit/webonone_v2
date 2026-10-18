import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CatalogRatingSummary,
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  PriceDisplay,
  StatusTag,
} from '@webonone/ui-kit'
import { useCatalogListReviewSummaries } from '../hooks/useCatalogListReviewSummaries'
import { isReviewableCatalogKind } from '@/features/reviews/utils/catalogReviewKind'
import { CompanyCatalogAiMenuItem } from './CompanyCatalogAiMenuItem'
import { CompanyCatalogListItemStockProgress } from './CompanyCatalogListItemStockProgress'
import { CompanyCatalogProductListVariantStock } from './CompanyCatalogProductListVariantStock'
import { CompanyCatalogServiceListMeta } from './CompanyCatalogServiceListMeta'
import { useCompanyProductListStockMeta } from '../hooks/useCompanyProductListStockMeta'
import {
  resolveWebPublishStatus,
  type CatalogEntityKind,
  type HydratedCatalogItem,
  type WebPublishStatus,
} from '../types/companyCatalog.types'
import { firstGalleryImageUrl } from '../utils/firstGalleryImageUrl'
import {
  getActiveCompanyProductListLine,
  companyProductListPriceDisplay,
  resolveCompanyProductListUnitPrice,
} from '@/features/company-catalog/utils/companyCatalogProductListStockLine'
import {
  companyServiceListHasTimeMeta,
  formatCompanyServiceScheduleSummary,
  formatCompanyServiceTimeModeLabel,
  resolveCompanyServiceTimePayload,
} from '@/features/company-catalog/utils/companyCatalogServiceListDisplay'
import type { ProductPickerStockDisplay } from '@/features/sales/utils/resolveProductPickerStockDisplay'

const gridPriceColumnClass = 'text-right tabular-nums'
const gridStockColumnClass = 'text-right text-muted-foreground'

function catalogStatusVariant(status: WebPublishStatus): 'pending' | 'verified' | 'approved' {
  if (status === 'published') return 'approved'
  if (status === 'completed') return 'verified'
  return 'pending'
}

function CatalogItemStatusTag({ status }: { status: WebPublishStatus | null | undefined }) {
  const { t } = useTranslation('catalog')
  const resolved = resolveWebPublishStatus(status)
  return <StatusTag variant={catalogStatusVariant(resolved)}>{t(`detail.webPublish.${resolved}`)}</StatusTag>
}

type CompanyCatalogItemsListProps = {
  items: HydratedCatalogItem[]
  kind: CatalogEntityKind
  showThumbnails: boolean
  empty: React.ReactNode
  previewMode?: boolean
  canManage?: boolean
  onOpen: (id: string) => void
  onRemove?: (item: HydratedCatalogItem) => void
  onShare?: (item: HydratedCatalogItem) => void
}

export function CompanyCatalogItemsList({
  items,
  kind,
  showThumbnails,
  empty,
  previewMode = false,
  canManage = false,
  onOpen,
  onRemove,
  onShare,
}: CompanyCatalogItemsListProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { t: tr } = useTranslation('reviews')
  const [selectedVariantByItemId, setSelectedVariantByItemId] = useState<Record<string, string>>({})
  const reviewSummaries = useCatalogListReviewSummaries(kind, items)
  const showRatings = isReviewableCatalogKind(kind)

  const productStockRefs = useMemo(
    () =>
      kind === 'products'
        ? items
            .filter(
              (item): item is HydratedCatalogItem & { libraryEntityId: string } =>
                typeof item.libraryEntityId === 'string' && item.libraryEntityId.length > 0,
            )
            .map((item) => ({
              companyProductId: item.id,
              libraryProductId: item.libraryEntityId,
            }))
        : [],
    [kind, items],
  )
  const stockByProductId = useCompanyProductListStockMeta(productStockRefs)

  const onSelectVariant = useCallback((catalogItemId: string, variantId: string) => {
    setSelectedVariantByItemId((prev) => ({ ...prev, [catalogItemId]: variantId }))
  }, [])

  function stockMetaForItem(item: HydratedCatalogItem): ProductPickerStockDisplay | undefined {
    return stockByProductId[item.id]
  }

  function renderItemRating(item: HydratedCatalogItem) {
    const summary = reviewSummaries[item.id]
    if (!summary || summary.count <= 0) return null
    return (
      <CatalogRatingSummary
        className="mt-1"
        averageRating={summary.averageRating}
        reviewCount={summary.count}
        countLabel={tr('listRatingCount', { count: summary.count })}
        ratingLabel={tr('ratingLabel')}
      />
    )
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
        cell: (item: HydratedCatalogItem) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => !previewMode && onOpen(item.id)}
            disabled={previewMode}
          >
            {item.displayName}
          </button>
        ),
      },
      {
        id: 'itemStatus',
        header: t('list.itemStatus'),
        sortable: true,
        compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) =>
          resolveWebPublishStatus(a.webPublishStatus).localeCompare(
            resolveWebPublishStatus(b.webPublishStatus),
            undefined,
            { sensitivity: 'base' },
          ),
        cell: (item: HydratedCatalogItem) => <CatalogItemStatusTag status={item.webPublishStatus} />,
      },
      {
        id: 'description',
        header: tc('description'),
        sortable: true,
        compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) =>
          (a.displayDescription ?? '').localeCompare(b.displayDescription ?? '', undefined, {
            sensitivity: 'base',
          }),
        cell: (item: HydratedCatalogItem) => (
          <p className="max-w-[16rem] truncate text-sm text-muted-foreground sm:max-w-xs md:max-w-sm">
            {item.displayDescription?.trim() ? item.displayDescription : '—'}
          </p>
        ),
      },
      ...(showRatings
        ? [
            {
              id: 'rating',
              header: t('list.rating'),
              sortable: true,
              compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) => {
                const avgA = reviewSummaries[a.id]?.averageRating ?? -1
                const avgB = reviewSummaries[b.id]?.averageRating ?? -1
                return avgA - avgB
              },
              cell: (item: HydratedCatalogItem) => renderItemRating(item) ?? '—',
            },
          ]
        : []),
      {
        id: 'binding',
        header: t('list.source'),
        cell: (item: HydratedCatalogItem) => (
          <div className="flex flex-wrap gap-1">
            <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
            {item.libraryUnavailable ? (
              <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
            ) : null}
          </div>
        ),
      },
      ...(kind === 'products'
        ? [
            {
              id: 'variant',
              header: t('list.selectVariant'),
              sortable: false,
              compare: () => 0,
              cell: (item: HydratedCatalogItem) =>
                item.libraryEntityId && !item.libraryUnavailable ? (
                  <div
                    className="min-w-[8rem]"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    role="presentation"
                  >
                    <CompanyCatalogProductListVariantStock
                      catalogItemId={item.id}
                      meta={stockMetaForItem(item)}
                      listPrice={item.listPrice}
                      selectedVariantId={selectedVariantByItemId[item.id]}
                      onSelectVariant={onSelectVariant}
                      showPrice={false}
                      showStock={false}
                    />
                  </div>
                ) : (
                  '—'
                ),
            },
            {
              id: 'stock',
              header: t('list.stock'),
              align: 'right' as const,
              sortable: true,
              compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) => {
                const qtyA =
                  getActiveCompanyProductListLine(
                    stockMetaForItem(a),
                    selectedVariantByItemId[a.id],
                  )?.totalQuantity ?? -1
                const qtyB =
                  getActiveCompanyProductListLine(
                    stockMetaForItem(b),
                    selectedVariantByItemId[b.id],
                  )?.totalQuantity ?? -1
                return qtyA - qtyB
              },
              className: gridStockColumnClass,
              headerClassName: gridStockColumnClass,
              cell: (item: HydratedCatalogItem) => {
                const line = getActiveCompanyProductListLine(
                  stockMetaForItem(item),
                  selectedVariantByItemId[item.id],
                )
                if (!line) return '—'
                return (
                  <div
                    className="flex justify-end"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    role="presentation"
                  >
                    <CompanyCatalogListItemStockProgress
                      companyProductId={item.id}
                      variantId={line.variantId}
                      quantity={line.totalQuantity}
                      align="end"
                    />
                  </div>
                )
              },
            },
            {
              id: 'price',
              header: t('list.price'),
              align: 'right' as const,
              sortable: true,
              compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) => {
                const priceA =
                  resolveCompanyProductListUnitPrice(
                    getActiveCompanyProductListLine(
                      stockMetaForItem(a),
                      selectedVariantByItemId[a.id],
                    ),
                    a.listPrice,
                  ) ?? -1
                const priceB =
                  resolveCompanyProductListUnitPrice(
                    getActiveCompanyProductListLine(
                      stockMetaForItem(b),
                      selectedVariantByItemId[b.id],
                    ),
                    b.listPrice,
                  ) ?? -1
                return priceA - priceB
              },
              className: gridPriceColumnClass,
              headerClassName: gridPriceColumnClass,
              cell: (item: HydratedCatalogItem) => {
                const price = companyProductListPriceDisplay(
                  getActiveCompanyProductListLine(
                    stockMetaForItem(item),
                    selectedVariantByItemId[item.id],
                  ),
                  item.listPrice,
                )
                return price != null ? (
                  <PriceDisplay
                    value={price.value}
                    compareAt={price.compareAt}
                    discountPercent={price.discountPercent}
                    size="sm"
                    align="right"
                  />
                ) : (
                  '—'
                )
              },
            },
          ]
        : []),
      ...(kind === 'services'
        ? [
            {
              id: 'timeMode',
              header: t('detail.time.timeMode'),
              sortable: true,
              compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) => {
                const modeA = resolveCompanyServiceTimePayload(a).timeMode
                const modeB = resolveCompanyServiceTimePayload(b).timeMode
                return formatCompanyServiceTimeModeLabel(modeA, t).localeCompare(
                  formatCompanyServiceTimeModeLabel(modeB, t),
                  undefined,
                  { sensitivity: 'base' },
                )
              },
              cell: (item: HydratedCatalogItem) => (
                <span className="text-sm text-foreground">
                  {formatCompanyServiceTimeModeLabel(
                    resolveCompanyServiceTimePayload(item).timeMode,
                    t,
                  )}
                </span>
              ),
            },
            {
              id: 'schedule',
              header: t('list.schedule'),
              sortable: true,
              compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) =>
                formatCompanyServiceScheduleSummary(a, t).localeCompare(
                  formatCompanyServiceScheduleSummary(b, t),
                  undefined,
                  { sensitivity: 'base' },
                ),
              cell: (item: HydratedCatalogItem) => (
                <span className="text-sm text-muted-foreground">
                  {formatCompanyServiceScheduleSummary(item, t)}
                </span>
              ),
            },
            {
              id: 'price',
              header: t('list.price'),
              align: 'right' as const,
              sortable: true,
              compare: (a: HydratedCatalogItem, b: HydratedCatalogItem) =>
                (a.listPrice ?? -1) - (b.listPrice ?? -1),
              className: gridPriceColumnClass,
              headerClassName: gridPriceColumnClass,
              cell: (item: HydratedCatalogItem) =>
                item.listPrice != null ? (
                  <PriceDisplay
                    value={item.listPrice}
                    compareAt={item.listPriceCompareAt}
                    discountPercent={item.listDiscountPercent}
                    size="sm"
                    align="right"
                  />
                ) : (
                  '—'
                ),
            },
          ]
        : []),
    ],
    [
      kind,
      onOpen,
      onSelectVariant,
      previewMode,
      reviewSummaries,
      selectedVariantByItemId,
      showRatings,
      stockByProductId,
      t,
      tc,
      tr,
    ],
  )

  function catalogItemDetails(
    item: HydratedCatalogItem,
    options?: {
      showPrice?: boolean
      showStock?: boolean
      showVariant?: boolean
      showServiceMeta?: boolean
    },
  ) {
    const showPrice = options?.showPrice ?? true
    const showStock = options?.showStock ?? true
    const showVariant = options?.showVariant ?? true
    const showServiceMeta = options?.showServiceMeta ?? true
    return (
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.displayName}</span>
          <CatalogItemStatusTag status={item.webPublishStatus} />
          <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
          {item.libraryUnavailable ? (
            <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
          ) : null}
        </div>
        {item.displayDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.displayDescription}</p>
        ) : null}
        {showRatings ? renderItemRating(item) : null}
        {kind === 'products' && item.libraryEntityId && !item.libraryUnavailable && showVariant ? (
          <CompanyCatalogProductListVariantStock
            catalogItemId={item.id}
            meta={stockMetaForItem(item)}
            listPrice={item.listPrice}
            selectedVariantId={selectedVariantByItemId[item.id]}
            onSelectVariant={onSelectVariant}
            showPrice={showPrice}
            showStock={showStock}
          />
        ) : null}
        {kind === 'services' && showServiceMeta ? (
          <CompanyCatalogServiceListMeta item={item} className="mt-2" showPrice={showPrice} />
        ) : null}
      </div>
    )
  }

  function serviceListAside(item: HydratedCatalogItem) {
    if (!companyServiceListHasTimeMeta(item) && item.listPrice == null) return null

    return (
      <div className="ml-auto flex w-fit max-w-[45%] shrink-0 flex-col items-end self-stretch sm:max-w-none">
        <CompanyCatalogServiceListMeta item={item} align="end" className="mt-auto" />
      </div>
    )
  }

  function productListAside(item: HydratedCatalogItem) {
    if (!item.libraryEntityId || item.libraryUnavailable) return null
    const meta = stockMetaForItem(item)
    const line = getActiveCompanyProductListLine(meta, selectedVariantByItemId[item.id])
    const unitPrice = resolveCompanyProductListUnitPrice(line, item.listPrice)
    if (!meta?.lines.length && unitPrice == null) return null

    return (
      <div className="ml-auto flex w-fit max-w-[45%] shrink-0 flex-col items-end gap-1 self-stretch sm:max-w-none">
        <CompanyCatalogProductListVariantStock
          catalogItemId={item.id}
          meta={meta}
          listPrice={item.listPrice}
          selectedVariantId={selectedVariantByItemId[item.id]}
          onSelectVariant={onSelectVariant}
          showPrice={false}
          showStock={false}
          align="end"
        />
        {line ? (
          <CompanyCatalogListItemStockProgress
            companyProductId={item.id}
            variantId={line.variantId}
            quantity={line.totalQuantity}
            align="end"
          />
        ) : null}
        {unitPrice != null ? (
          <PriceDisplay value={unitPrice} size="sm" align="right" className="mt-auto" />
        ) : null}
      </div>
    )
  }

  function rowBody(item: HydratedCatalogItem) {
    return (
      <div
        className={
          kind === 'products' || kind === 'services'
            ? 'flex w-full items-stretch gap-3'
            : 'flex w-full items-start gap-3'
        }
      >
        {showThumbnails ? (
          <ImagePreview
            src={firstGalleryImageUrl(item.displayGalleryImages)}
            alt=""
            className={itemListThumbClassName}
          />
        ) : null}
        {catalogItemDetails(item, {
          showPrice: false,
          showStock: false,
          showVariant: false,
          showServiceMeta: false,
        })}
        {kind === 'products' ? productListAside(item) : null}
        {kind === 'services' ? serviceListAside(item) : null}
      </div>
    )
  }

  function productCardVariantStock(item: HydratedCatalogItem) {
    if (!item.libraryEntityId || item.libraryUnavailable) return null
    const meta = stockMetaForItem(item)
    const line = getActiveCompanyProductListLine(meta, selectedVariantByItemId[item.id])
    if (!meta?.lines.length && !line) return null

    return (
      <div className="mt-2 flex w-full min-w-0 flex-col items-stretch gap-2 self-stretch">
        <CompanyCatalogProductListVariantStock
          catalogItemId={item.id}
          meta={meta}
          listPrice={item.listPrice}
          selectedVariantId={selectedVariantByItemId[item.id]}
          onSelectVariant={onSelectVariant}
          showPrice={false}
          showStock={(meta?.lines.length ?? 0) > 0}
          fullWidth
          stockSize="full"
          align="start"
        />
      </div>
    )
  }

  function productCardPrice(item: HydratedCatalogItem) {
    if (!item.libraryEntityId || item.libraryUnavailable) return null
    const line = getActiveCompanyProductListLine(
      stockMetaForItem(item),
      selectedVariantByItemId[item.id],
    )
    const price = companyProductListPriceDisplay(line, item.listPrice)
    if (price == null) return null

    return (
      <PriceDisplay
        value={price.value}
        compareAt={price.compareAt}
        discountPercent={price.discountPercent}
        size="sm"
        align="right"
        className="mt-auto pt-2"
      />
    )
  }

  function catalogCardImage(item: HydratedCatalogItem) {
    const src = showThumbnails ? firstGalleryImageUrl(item.displayGalleryImages) : null
    return (
      <ImagePreview
        src={src}
        alt={item.displayName}
        className={itemListCardImageClassName}
      />
    )
  }

  function renderRowMenu(item: HydratedCatalogItem) {
    if (previewMode) return null
    const canShare =
      Boolean(onShare) && resolveWebPublishStatus(item.webPublishStatus) === 'published'
    return (
      <ItemListMenu ariaLabel={`${tc('actions')} ${item.displayName}`}>
        {canShare && onShare ? (
          <DropdownMenuItem onClick={() => onShare(item)}>{t('share.action')}</DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => onOpen(item.id)}>{tc('details')}</DropdownMenuItem>
        <CompanyCatalogAiMenuItem kind={kind} id={item.id} label={item.displayName} />
        {canManage && onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove(item)}
            >
              {tc('remove')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  return (
    <CollectionListView
      items={items}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>{empty}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(item) => (
        <ItemListItem>
          <ItemListContent>
            {previewMode ? (
              <div className="w-full rounded-md text-left">{rowBody(item)}</div>
            ) : (
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(item.id)}
              >
                {rowBody(item)}
              </button>
            )}
          </ItemListContent>
          {renderRowMenu(item)}
        </ItemListItem>
      )}
      renderCard={(item) => (
        <ItemListCollectionCard
          className={kind === 'products' || kind === 'services' ? 'h-full' : undefined}
          image={catalogCardImage(item)}
          menu={renderRowMenu(item)}
          onBodyClick={previewMode ? undefined : () => onOpen(item.id)}
        >
          <div className="flex h-full min-h-[7.5rem] w-full flex-col items-stretch">
            {catalogItemDetails(item, {
              showPrice: false,
              showStock: false,
              showVariant: false,
              showServiceMeta: false,
            })}
            {kind === 'products' ? (
              <div className="flex w-full min-w-0 flex-1 flex-col items-stretch">
                {productCardVariantStock(item)}
              </div>
            ) : null}
            {kind === 'services' ? (
              <div className="flex w-full min-w-0 flex-1 flex-col items-stretch">
                <CompanyCatalogServiceListMeta item={item} className="mt-2 flex-1" showPrice={false} />
              </div>
            ) : null}
            {kind === 'products' ? productCardPrice(item) : null}
            {kind === 'services' && item.listPrice != null ? (
              <PriceDisplay
                value={item.listPrice}
                compareAt={item.listPriceCompareAt}
                discountPercent={item.listDiscountPercent}
                size="sm"
                align="right"
                className="mt-auto pt-2"
              />
            ) : null}
          </div>
        </ItemListCollectionCard>
      )}
    />
  )
}
