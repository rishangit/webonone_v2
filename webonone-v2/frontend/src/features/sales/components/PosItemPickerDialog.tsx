import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Label,
  itemListThumbClassName,
  SearchInput,
  SegmentedSwitch,
  SegmentedSwitchItem,
  Spinner,
} from '@webonone/ui-kit'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  dataLibraryApi,
  type LibraryListItem,
} from '@/features/company-catalog/services/dataLibraryApi'
import type { CatalogEntityKind, HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import { catalogItemImageUrl, firstGalleryImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import type { PosProductPickResult } from '@/features/sales/hooks/usePosProductPick'
import type { PosLibraryRequest, SaleItemKind } from '@/features/sales/types/sales.types'
import { buildLibraryRequestFromPick } from '@/features/sales/utils/libraryRequestNotes'
import {
  PosPickerProductStockInline,
} from '@/features/sales/components/PosPickerProductStockMeta'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import {
  resolveProductPickerStockDisplay,
  type ProductPickerStockDisplay,
} from '@/features/sales/utils/resolveProductPickerStockDisplay'

const TABS: Array<{ kind: SaleItemKind; catalogKind: CatalogEntityKind; labelKey: string }> = [
  { kind: 'product', catalogKind: 'products', labelKey: 'pos.pickerTabProducts' },
  { kind: 'service', catalogKind: 'services', labelKey: 'pos.pickerTabServices' },
  { kind: 'space', catalogKind: 'spaces', labelKey: 'pos.pickerTabSpaces' },
]

type ItemSource = 'local' | 'library'

type PosItemPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabledKinds: SaleItemKind[]
  onPick: (
    item: HydratedCatalogItem,
    itemKind: SaleItemKind,
  ) => void | PosProductPickResult | Promise<void | PosProductPickResult>
  libraryModeEnabled?: boolean
  onPickLibrary?: (request: PosLibraryRequest) => void
  /** Stacked inside another dialog (session workflow sale dialog). */
  stackLevel?: number
  nestedDismissGuard?: boolean
}

function matchesCatalogSearch(item: HydratedCatalogItem, query: string): boolean {
  const haystacks = [
    item.displayName,
    item.displayDescription,
    item.name,
    item.description,
    typeof item.payload?.name === 'string' ? item.payload.name : null,
    typeof item.payload?.description === 'string' ? item.payload.description : null,
  ]
  return haystacks.some((value) => value?.toLowerCase().includes(query))
}

export function PosItemPickerDialog({
  open,
  onOpenChange,
  enabledKinds,
  onPick,
  libraryModeEnabled = false,
  onPickLibrary,
  stackLevel,
  nestedDismissGuard = false,
}: PosItemPickerDialogProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const tabs = useMemo(
    () => TABS.filter((tab) => enabledKinds.includes(tab.kind)),
    [enabledKinds],
  )
  const [tabKind, setTabKind] = useState<SaleItemKind>(tabs[0]?.kind ?? 'product')
  const [search, setSearch] = useState('')
  const [itemSource, setItemSource] = useState<ItemSource>('local')
  const [localItems, setLocalItems] = useState<HydratedCatalogItem[]>([])
  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [libraryItems, setLibraryItems] = useState<LibraryListItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [productStockById, setProductStockById] = useState<Record<string, ProductPickerStockDisplay>>({})

  const activeTab = tabs.find((tab) => tab.kind === tabKind) ?? tabs[0]
  const activeCatalogKind = activeTab?.catalogKind
  const isLibrarySource = libraryModeEnabled && itemSource === 'library'
  const searchQuery = search.trim()

  useEffect(() => {
    if (!open) {
      setItemSource('local')
      setSearch('')
      setLocalItems([])
      setLibraryItems([])
      setProductStockById({})
    }
  }, [open])

  useEffect(() => {
    if (!open || !activeCatalogKind || isLibrarySource) return
    let cancelled = false
    setLocalLoading(true)
    setLocalError(null)
    const handle = window.setTimeout(() => {
      companyCatalogApi
        .list(activeCatalogKind, { q: searchQuery || undefined })
        .then(async (result) => {
          if (cancelled) return
          const items = await hydrateLinkedCatalogItems(activeCatalogKind, result.items)
          if (!cancelled) setLocalItems(items)
        })
        .catch((err) => {
          if (!cancelled) {
            setLocalItems([])
            setLocalError(err instanceof Error ? err.message : t('pos.pickerLoadFailed'))
          }
        })
        .finally(() => {
          if (!cancelled) setLocalLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [open, activeCatalogKind, isLibrarySource, searchQuery, t])

  useEffect(() => {
    if (!open || isLibrarySource || tabKind !== 'product') {
      setProductStockById({})
      return
    }

    const linkedProducts = localItems.filter((item) => item.libraryEntityId)
    if (linkedProducts.length === 0) {
      setProductStockById({})
      return
    }

    let cancelled = false
    void Promise.all(
      linkedProducts.map(async (item) => {
        const meta = await resolveProductPickerStockDisplay(item.libraryEntityId!)
        return { id: item.id, meta }
      }),
    )
      .then((entries) => {
        if (cancelled) return
        setProductStockById(Object.fromEntries(entries.map((entry) => [entry.id, entry.meta])))
      })
      .catch(() => {
        if (!cancelled) setProductStockById({})
      })

    return () => {
      cancelled = true
    }
  }, [open, isLibrarySource, tabKind, localItems])

  useEffect(() => {
    if (!open || !activeCatalogKind || !isLibrarySource) return
    let cancelled = false
    setLibraryLoading(true)
    setLibraryError(null)
    const handle = window.setTimeout(() => {
      dataLibraryApi
        .list(activeCatalogKind, { q: searchQuery || undefined, pageSize: 48 })
        .then((result) => {
          if (!cancelled) setLibraryItems(result.items ?? [])
        })
        .catch((err) => {
          if (!cancelled) {
            setLibraryItems([])
            setLibraryError(err instanceof Error ? err.message : t('pos.libraryPickerLoadFailed'))
          }
        })
        .finally(() => {
          if (!cancelled) setLibraryLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [open, activeCatalogKind, searchQuery, isLibrarySource, t])

  useEffect(() => {
    if (tabs.length === 0) return
    if (!tabs.some((tab) => tab.kind === tabKind)) {
      setTabKind(tabs[0].kind)
    }
  }, [tabs, tabKind])

  const filteredLocalItems = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return localItems
    return localItems.filter((item) => matchesCatalogSearch(item, q))
  }, [localItems, searchQuery])

  const filteredLibraryItems = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return libraryItems
    return libraryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false),
    )
  }, [libraryItems, searchQuery])

  function handleLibraryPick(item: LibraryListItem) {
    if (!activeTab || !onPickLibrary) return
    onPickLibrary(
      buildLibraryRequestFromPick({
        libraryEntityId: item.id,
        name: item.name,
        itemKind: activeTab.kind,
        imageUrl: firstGalleryImageUrl(item.galleryImages),
      }),
    )
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('pos.pickerTitle')}
      description={
        isLibrarySource ? t('pos.libraryPickerDescription') : t('pos.pickerDescription')
      }
      sizeWidth="large"
      sizeHeight="large"
      stackLevel={stackLevel}
      nestedDismissGuard={nestedDismissGuard}
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('close')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {libraryModeEnabled ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Label htmlFor="pos-item-source" className="text-sm font-medium text-muted-foreground">
              {t('pos.itemSource')}
            </Label>
            <SegmentedSwitch
              id="pos-item-source"
              value={itemSource}
              onValueChange={(value) => setItemSource(value as ItemSource)}
              aria-label={t('pos.itemSource')}
            >
              <SegmentedSwitchItem value="local">{t('pos.sourceLocalStock')}</SegmentedSwitchItem>
              <SegmentedSwitchItem value="library">{t('pos.sourceFromLibrary')}</SegmentedSwitchItem>
            </SegmentedSwitch>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.kind}
              type="button"
              size="sm"
              variant={tab.kind === tabKind ? 'default' : 'outline'}
              onClick={() => setTabKind(tab.kind)}
            >
              {t(tab.labelKey)}
            </Button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder={
            isLibrarySource ? t('pos.libraryPickerSearchPlaceholder') : t('pos.pickerSearchPlaceholder')
          }
          aria-label={
            isLibrarySource ? t('pos.libraryPickerSearchAria') : t('pos.pickerSearchAria')
          }
        />
        {isLibrarySource ? (
          libraryLoading && libraryItems.length === 0 ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : libraryError ? (
            <p className="text-sm text-destructive">{libraryError}</p>
          ) : libraryItems.length === 0 ? (
            <ItemListEmpty>{t('pos.libraryPickerEmpty')}</ItemListEmpty>
          ) : filteredLibraryItems.length === 0 ? (
            <ItemListEmpty>{t('pos.pickerEmpty')}</ItemListEmpty>
          ) : (
            <ItemList>
              {filteredLibraryItems.map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => handleLibraryPick(item)}
                    >
                      <ImagePreview
                        src={firstGalleryImageUrl(item.galleryImages)}
                        alt={item.name}
                        mode="view"
                        className={itemListThumbClassName}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activeTab ? t(`kinds.${activeTab.kind}`) : null}
                        </p>
                      </div>
                    </button>
                  </ItemListContent>
                </ItemListItem>
              ))}
            </ItemList>
          )
        ) : localLoading && localItems.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : localError ? (
          <p className="text-sm text-destructive">{localError}</p>
        ) : localItems.length === 0 ? (
          <ItemListEmpty>{t('pos.pickerEmpty')}</ItemListEmpty>
        ) : filteredLocalItems.length === 0 ? (
          <ItemListEmpty>{t('pos.pickerEmpty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {filteredLocalItems.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      if (!activeTab) return
                      void (async () => {
                        const result = await onPick(item, activeTab.kind)
                        if (result !== 'variant-opened') {
                          onOpenChange(false)
                        }
                      })()
                    }}
                  >
                    <ImagePreview
                      src={catalogItemImageUrl(item)}
                      alt={item.displayName}
                      mode="view"
                      className={itemListThumbClassName}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.displayName}</p>
                      {item.displayDescription ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {item.displayDescription}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {activeTab ? <span>{t(`kinds.${activeTab.kind}`)}</span> : null}
                        {item.listPrice != null ? <span>{formatLkr(item.listPrice)}</span> : null}
                        {tabKind === 'product' && item.libraryEntityId ? (
                          <PosPickerProductStockInline meta={productStockById[item.id]} />
                        ) : null}
                      </div>
                    </div>
                  </button>
                </ItemListContent>
              </ItemListItem>
            ))}
          </ItemList>
        )}
      </div>
    </CustomDialog>
  )
}
