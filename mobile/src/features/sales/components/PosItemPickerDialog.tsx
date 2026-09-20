import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  SegmentedSwitch,
  SegmentedSwitchItem,
  Spinner,
  itemListThumbClassName,
} from '@webonone/mobile-ui'
import { catalogApi } from '@/features/sales/services/catalogApi'
import type { CatalogEntityKind, HydratedCatalogItem } from '@/features/sales/types/catalog.types'
import type { SaleItemKind } from '@/features/sales/types/sales.types'
import { catalogItemImageUrl } from '@/features/sales/utils/catalogItemImageUrl'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import { hydrateCatalogItems } from '@/features/sales/utils/hydrateCatalogItems'

const TABS: Array<{ kind: SaleItemKind; catalogKind: CatalogEntityKind; label: string }> = [
  { kind: 'product', catalogKind: 'products', label: 'Products' },
  { kind: 'service', catalogKind: 'services', label: 'Services' },
  { kind: 'space', catalogKind: 'spaces', label: 'Spaces' },
]

type PosItemPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabledKinds: SaleItemKind[]
  onPick: (item: HydratedCatalogItem, itemKind: SaleItemKind) => void | Promise<void>
  picking?: boolean
}

export function PosItemPickerDialog({
  open,
  onOpenChange,
  enabledKinds,
  onPick,
  picking = false,
}: PosItemPickerDialogProps) {
  const tabs = useMemo(() => TABS.filter((tab) => enabledKinds.includes(tab.kind)), [enabledKinds])
  const [tabKind, setTabKind] = useState<SaleItemKind>(tabs[0]?.kind ?? 'product')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<HydratedCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeTab = tabs.find((tab) => tab.kind === tabKind) ?? tabs[0]
  const searchQuery = search.trim()

  useEffect(() => {
    if (!open) {
      setSearch('')
      setItems([])
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !activeTab) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const handle = setTimeout(() => {
      catalogApi
        .list(activeTab.catalogKind, { q: searchQuery || undefined })
        .then(async (result) => {
          if (cancelled) return
          const hydrated = await hydrateCatalogItems(activeTab.catalogKind, result.items)
          if (!cancelled) setItems(hydrated)
        })
        .catch((err) => {
          if (!cancelled) {
            setItems([])
            setError(err instanceof Error ? err.message : 'Failed to load catalog items')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [open, activeTab, searchQuery])

  useEffect(() => {
    if (tabs[0] && !tabs.some((tab) => tab.kind === tabKind)) {
      setTabKind(tabs[0].kind)
    }
  }, [tabs, tabKind])

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add item"
      description="Choose a product, service, or space from the company catalog."
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <Button variant="outline" onPress={() => onOpenChange(false)}>Cancel</Button>
      }
    >
      <View className="gap-3">
        {tabs.length > 1 ? (
          <SegmentedSwitch value={tabKind} onValueChange={(value) => setTabKind(value as SaleItemKind)}>
            {tabs.map((tab) => (
              <SegmentedSwitchItem key={tab.kind} value={tab.kind}>{tab.label}</SegmentedSwitchItem>
            ))}
          </SegmentedSwitch>
        ) : null}

        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search catalog"
          accessibilityLabel="Search catalog"
        />

        {loading ? <Spinner label="Loading catalog…" /> : null}
        {error ? <Body className="text-destructive">{error}</Body> : null}

        {!loading && items.length === 0 ? (
          <ItemListEmpty>No catalog items in this category.</ItemListEmpty>
        ) : null}

        {!loading && items.length > 0 ? (
          <ItemList>
            {items.map((item) => (
              <ItemListItem key={item.id}>
                <Pressable
                  accessibilityRole="button"
                  disabled={picking}
                  onPress={() => void onPick(item, activeTab!.kind)}
                  className="flex-1 flex-row items-center gap-3"
                >
                  <ImagePreview
                    src={catalogItemImageUrl(item)}
                    alt={item.displayName}
                    className={itemListThumbClassName}
                  />
                  <ItemListContent
                    title={item.displayName}
                    subtitle={
                      [
                        item.displayDescription,
                        item.listPrice != null ? formatLkr(item.listPrice) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                  />
                </Pressable>
              </ItemListItem>
            ))}
          </ItemList>
        ) : null}
      </View>
    </CustomDialog>
  )
}
