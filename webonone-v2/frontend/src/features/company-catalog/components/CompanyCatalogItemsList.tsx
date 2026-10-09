import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  itemListThumbClassName,
  StatusTag,
} from '@webonone/ui-kit'
import { CompanyCatalogAiMenuItem } from './CompanyCatalogAiMenuItem'
import type { HydratedCatalogItem } from '../types/companyCatalog.types'
import type { CatalogEntityKind } from '../types/companyCatalog.types'
import { firstGalleryImageUrl } from '../utils/firstGalleryImageUrl'

type CompanyCatalogItemsListProps = {
  items: HydratedCatalogItem[]
  kind: CatalogEntityKind
  showThumbnails: boolean
  empty: React.ReactNode
  previewMode?: boolean
  canManage?: boolean
  onOpen: (id: string) => void
  onRemove?: (item: HydratedCatalogItem) => void
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
}: CompanyCatalogItemsListProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')

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
        id: 'binding',
        header: tc('status'),
        cell: (item: HydratedCatalogItem) => (
          <div className="flex flex-wrap gap-1">
            <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
            {item.libraryUnavailable ? (
              <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
            ) : null}
          </div>
        ),
      },
    ],
    [onOpen, previewMode, t, tc],
  )

  function catalogItemDetails(item: HydratedCatalogItem) {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.displayName}</span>
          <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
          {item.libraryUnavailable ? (
            <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
          ) : null}
        </div>
        {item.displayDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.displayDescription}</p>
        ) : null}
      </div>
    )
  }

  function rowBody(item: HydratedCatalogItem) {
    return (
      <div className="flex w-full items-start gap-3">
        {showThumbnails ? (
          <ImagePreview
            src={firstGalleryImageUrl(item.displayGalleryImages)}
            alt=""
            className={itemListThumbClassName}
          />
        ) : null}
        {catalogItemDetails(item)}
      </div>
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
    return (
      <ItemListMenu ariaLabel={`${tc('actions')} ${item.displayName}`}>
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
          image={catalogCardImage(item)}
          menu={renderRowMenu(item)}
          onBodyClick={previewMode ? undefined : () => onOpen(item.id)}
        >
          {catalogItemDetails(item)}
        </ItemListCollectionCard>
      )}
    />
  )
}
