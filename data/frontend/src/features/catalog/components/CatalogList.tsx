import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
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
  ItemListStatus,
  itemListThumbClassName,
  PriceDisplay,
  TagChip,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { CopyToAiMenuItem } from '@/features/shell/components/CopyToAiMenuItem'
import { ProductListVariantStock } from '@/features/products/components/ProductListVariantStock'
import { useProductListStockMeta } from '@/features/products/hooks/useProductListStockMeta'
import {
  getActiveProductListLine,
  resolveProductListUnitPrice,
} from '@/features/products/utils/productListStockLine'
import { ServiceListMeta } from '@/features/services/components/ServiceListMeta'
import {
  formatServiceScheduleSummary,
  formatServiceTimeModeLabel,
  normalizeServiceListItem,
  resolveServiceListPrice,
} from '@/features/services/utils/serviceListDisplay'
import type { CatalogGalleryImage, CatalogItem } from '@/shared/types/data.types'

const gridPriceColumnClass = 'text-right tabular-nums'

const ENTITY_KIND_BY_ITEM_TYPE = {
  products: 'product',
  services: 'service',
  spaces: 'space',
} as const

function firstGalleryImageUrl(images: CatalogGalleryImage[] | null | undefined): string | null {
  const url = images?.[0]?.url
  return typeof url === 'string' && url.trim() ? url : null
}

type CatalogListKind = 'products' | 'services' | 'spaces'

interface CatalogListProps {
  itemType: CatalogListKind
  items: CatalogItem[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  onView?: (id: string) => void
  canEdit: boolean
  canDelete: boolean
}

export function CatalogList({
  itemType,
  items,
  onEdit,
  onDeleted,
  onVerify,
  onView,
  canEdit,
  canDelete,
}: CatalogListProps) {
  const { t } = useTranslation(itemType)
  const { t: tc } = useTranslation('common')
  const { t: tp } = useTranslation('products')
  const { t: ts } = useTranslation('services')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [selectedVariantByProductId, setSelectedVariantByProductId] = useState<Record<string, string>>(
    {},
  )
  const productIds = useMemo(
    () => (itemType === 'products' ? items.map((item) => item.id) : []),
    [itemType, items],
  )
  const stockByProductId = useProductListStockMeta(productIds)

  const onSelectVariant = useCallback((productId: string, variantId: string) => {
    setSelectedVariantByProductId((prev) => ({ ...prev, [productId]: variantId }))
  }, [])

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: CatalogItem, b: CatalogItem) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (item: CatalogItem) =>
          onView ? (
            <button
              type="button"
              className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onView(item.id)}
            >
              {item.name}
            </button>
          ) : (
            item.name
          ),
      },
      {
        id: 'description',
        header: tc('description'),
        sortable: true,
        compare: (a: CatalogItem, b: CatalogItem) =>
          (a.description ?? '').localeCompare(b.description ?? '', undefined, { sensitivity: 'base' }),
        cell: (item: CatalogItem) => (
          <p className="max-w-[16rem] truncate text-sm text-muted-foreground sm:max-w-xs md:max-w-sm">
            {item.description?.trim() ? item.description : '—'}
          </p>
        ),
      },
      ...(itemType === 'services'
        ? [
            {
              id: 'price',
              header: ts('list.price'),
              align: 'right' as const,
              sortable: true,
              compare: (a: CatalogItem, b: CatalogItem) =>
                (resolveServiceListPrice(a) ?? -1) - (resolveServiceListPrice(b) ?? -1),
              className: gridPriceColumnClass,
              headerClassName: gridPriceColumnClass,
              cell: (item: CatalogItem) => {
                const price = resolveServiceListPrice(item)
                return price != null ? <PriceDisplay value={price} size="sm" align="right" /> : '—'
              },
            },
            {
              id: 'timeMode',
              header: ts('timeMode'),
              sortable: true,
              compare: (a: CatalogItem, b: CatalogItem) => {
                const normA = normalizeServiceListItem(a)
                const normB = normalizeServiceListItem(b)
                return formatServiceTimeModeLabel(normA.timeMode, ts).localeCompare(
                  formatServiceTimeModeLabel(normB.timeMode, ts),
                  undefined,
                  { sensitivity: 'base' },
                )
              },
              cell: (item: CatalogItem) => (
                <span className="text-sm text-foreground">
                  {formatServiceTimeModeLabel(normalizeServiceListItem(item).timeMode, ts)}
                </span>
              ),
            },
            {
              id: 'schedule',
              header: ts('list.schedule'),
              sortable: true,
              compare: (a: CatalogItem, b: CatalogItem) =>
                formatServiceScheduleSummary(a, ts).localeCompare(
                  formatServiceScheduleSummary(b, ts),
                  undefined,
                  { sensitivity: 'base' },
                ),
              cell: (item: CatalogItem) => (
                <span className="text-sm text-muted-foreground">
                  {formatServiceScheduleSummary(item, ts)}
                </span>
              ),
            },
          ]
        : []),
      {
        id: 'refs',
        header: 'Refs',
        sortable: true,
        compare: (a: CatalogItem, b: CatalogItem) => (a.referenceCount ?? 0) - (b.referenceCount ?? 0),
        cell: (item: CatalogItem) => t('refs', { count: item.referenceCount ?? 0 }),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (item: CatalogItem) => <StatusBadge status={item.status} />,
      },
      ...(itemType === 'products'
        ? [
            {
              id: 'variant',
              header: tp('list.selectVariant'),
              sortable: false,
              compare: () => 0,
              cell: (item: CatalogItem) => (
                <div
                  className="min-w-[8rem]"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  role="presentation"
                >
                  <ProductListVariantStock
                    productId={item.id}
                    meta={stockByProductId[item.id]}
                    selectedVariantId={selectedVariantByProductId[item.id]}
                    onSelectVariant={onSelectVariant}
                    showPrice={false}
                    showStock={false}
                  />
                </div>
              ),
            },
            {
              id: 'price',
              header: tp('list.price'),
              align: 'right' as const,
              sortable: true,
              compare: (a: CatalogItem, b: CatalogItem) => {
                const priceA =
                  resolveProductListUnitPrice(
                    getActiveProductListLine(
                      stockByProductId[a.id],
                      selectedVariantByProductId[a.id],
                    ),
                  ) ?? -1
                const priceB =
                  resolveProductListUnitPrice(
                    getActiveProductListLine(
                      stockByProductId[b.id],
                      selectedVariantByProductId[b.id],
                    ),
                  ) ?? -1
                return priceA - priceB
              },
              className: gridPriceColumnClass,
              headerClassName: gridPriceColumnClass,
              cell: (item: CatalogItem) => {
                const price = resolveProductListUnitPrice(
                  getActiveProductListLine(
                    stockByProductId[item.id],
                    selectedVariantByProductId[item.id],
                  ),
                )
                return price != null ? <PriceDisplay value={price} size="sm" align="right" /> : '—'
              },
            },
          ]
        : []),
    ],
    [
      itemType,
      onSelectVariant,
      onView,
      selectedVariantByProductId,
      stockByProductId,
      t,
      tc,
      tp,
      ts,
    ],
  )

  function renderRowMenu(item: CatalogItem) {
    const showMenu = Boolean(onView) || canEdit || canDelete
    if (!showMenu) return null
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
        {onView ? (
          <DropdownMenuItem onClick={() => onView(item.id)}>{t('viewDetails')}</DropdownMenuItem>
        ) : null}
        <CopyToAiMenuItem
          kind={ENTITY_KIND_BY_ITEM_TYPE[itemType]}
          id={item.id}
          label={item.name}
        />
        {canDelete && item.status === 'pending' && onVerify ? (
          <DropdownMenuItem onClick={() => onVerify(item.id)}>{t('verify')}</DropdownMenuItem>
        ) : null}
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(item.id)}>{t('common:edit')}</DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setPendingDelete({ id: item.id, name: item.name })}
            >
              {t('common:delete')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function catalogDetails(
    item: CatalogItem,
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
      <div className="min-w-0 w-full flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{item.name}</p>
          <span className="text-xs text-muted-foreground">
            {t('refs', { count: item.referenceCount ?? 0 })}
          </span>
        </div>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {item.tags.length > 3 ? (
            <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
          ) : null}
        </div>
        {itemType === 'products' && showVariant ? (
          <ProductListVariantStock
            productId={item.id}
            meta={stockByProductId[item.id]}
            selectedVariantId={selectedVariantByProductId[item.id]}
            onSelectVariant={onSelectVariant}
            showPrice={showPrice}
            showStock={showStock}
          />
        ) : null}
        {itemType === 'services' && showServiceMeta ? (
          <ServiceListMeta item={item} className="mt-2" showPrice={showPrice} />
        ) : null}
      </div>
    )
  }

  function serviceListAside(item: CatalogItem) {
    return (
      <div className="ml-auto flex w-fit max-w-[45%] shrink-0 flex-col self-stretch sm:max-w-none">
        <ServiceListMeta item={item} align="end" className="mt-auto" />
      </div>
    )
  }

  function productListAside(item: CatalogItem) {
    const meta = stockByProductId[item.id]
    const line = getActiveProductListLine(meta, selectedVariantByProductId[item.id])
    const unitPrice = resolveProductListUnitPrice(line)
    if (!meta?.lines.length && unitPrice == null) return null

    return (
      <div className="ml-auto flex w-fit max-w-[45%] shrink-0 flex-col items-end gap-1 self-stretch sm:max-w-none">
        <ProductListVariantStock
          productId={item.id}
          meta={meta}
          selectedVariantId={selectedVariantByProductId[item.id]}
          onSelectVariant={onSelectVariant}
          showPrice={false}
          showStock={false}
          align="end"
        />
        {unitPrice != null ? (
          <span className="mt-auto text-right text-sm font-medium tabular-nums text-foreground">
            <PriceDisplay value={unitPrice} size="sm" align="right" />
          </span>
        ) : null}
      </div>
    )
  }

  function rowBody(item: CatalogItem) {
    return (
      <div
        className={
          itemType === 'products' || itemType === 'services'
            ? 'flex w-full items-stretch gap-3'
            : 'flex w-full items-start gap-3'
        }
      >
        <ImagePreview
          src={firstGalleryImageUrl(item.galleryImages)}
          alt=""
          className={itemListThumbClassName}
        />
        {catalogDetails(item, {
          showPrice: false,
          showStock: false,
          showVariant: false,
          showServiceMeta: false,
        })}
        {itemType === 'products' ? productListAside(item) : null}
        {itemType === 'services' ? serviceListAside(item) : null}
      </div>
    )
  }

  function productCardVariantStock(item: CatalogItem) {
    const line = getActiveProductListLine(
      stockByProductId[item.id],
      selectedVariantByProductId[item.id],
    )
    const meta = stockByProductId[item.id]
    if (!meta?.lines.length && !line) return null

    return (
      <div className="mt-2 flex w-full min-w-0 flex-col items-stretch gap-2 self-stretch">
        <ProductListVariantStock
          productId={item.id}
          meta={meta}
          selectedVariantId={selectedVariantByProductId[item.id]}
          onSelectVariant={onSelectVariant}
          showPrice={false}
          showStock={false}
          fullWidth
          stockSize="full"
          align="start"
        />
      </div>
    )
  }

  function productCardPrice(item: CatalogItem) {
    const line = getActiveProductListLine(
      stockByProductId[item.id],
      selectedVariantByProductId[item.id],
    )
    const unitPrice = resolveProductListUnitPrice(line)
    if (unitPrice == null) return null

    return (
      <p className="mt-auto pt-2 text-right text-sm font-medium tabular-nums text-foreground">
        <PriceDisplay value={unitPrice} size="sm" align="right" className="mt-auto pt-2" />
      </p>
    )
  }

  function rowClick(item: CatalogItem) {
    if (onView) onView(item.id)
  }

  return (
    <>
      <CollectionListView
        items={items}
        getRowKey={(item) => item.id}
        columns={columns}
        empty={<ItemListEmpty>{t('emptyFound')}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(item) => (
          <ItemListItem>
            <ItemListContent>
              {onView ? (
                <button
                  type="button"
                  className="block w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => rowClick(item)}
                >
                  {rowBody(item)}
                </button>
              ) : (
                <div className="w-full">{rowBody(item)}</div>
              )}
            </ItemListContent>
            <ItemListStatus>
              <StatusBadge status={item.status} />
            </ItemListStatus>
            {renderRowMenu(item)}
          </ItemListItem>
        )}
        renderCard={(item) => (
          <ItemListCollectionCard
            className={itemType === 'products' || itemType === 'services' ? 'h-full' : undefined}
            image={
              <ImagePreview
                src={firstGalleryImageUrl(item.galleryImages)}
                alt={item.name}
                className={itemListCardImageClassName}
              />
            }
            menu={renderRowMenu(item)}
            onBodyClick={onView ? () => rowClick(item) : undefined}
          >
            <div className="flex h-full min-h-[7.5rem] w-full flex-col items-stretch">
              {catalogDetails(item, {
                showPrice: false,
                showStock: false,
                showVariant: false,
                showServiceMeta: false,
              })}
              {itemType === 'products' ? (
                <div className="flex w-full min-w-0 flex-1 flex-col items-stretch">
                  {productCardVariantStock(item)}
                </div>
              ) : null}
              {itemType === 'services' ? (
                <div className="flex w-full min-w-0 flex-1 flex-col items-stretch">
                  <ServiceListMeta item={item} className="mt-2 flex-1" />
                </div>
              ) : null}
              <div className="mt-2 shrink-0">
                <ItemListStatus>
                  <StatusBadge status={item.status} />
                </ItemListStatus>
              </div>
              {itemType === 'products' ? productCardPrice(item) : null}
            </div>
          </ItemListCollectionCard>
        )}
      />
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? t('deleteConfirm', { name: pendingDelete.name }) : t('deleteConfirmFallback')}
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) onDeleted(pendingDelete.id)
        }}
      />
    </>
  )
}
