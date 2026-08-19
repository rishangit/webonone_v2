import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type { CatalogEntityKind, HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SaleItemKind } from '@/features/sales/types/sales.types'
import { formatLkr } from '@/features/sales/utils/formatMoney'

const TABS: Array<{ kind: SaleItemKind; catalogKind: CatalogEntityKind; label: string }> = [
  { kind: 'product', catalogKind: 'products', label: 'Products' },
  { kind: 'service', catalogKind: 'services', label: 'Services' },
  { kind: 'space', catalogKind: 'spaces', label: 'Spaces' },
]

type PosItemPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabledKinds: SaleItemKind[]
  onPick: (item: HydratedCatalogItem, itemKind: SaleItemKind) => void
}

export function PosItemPickerDialog({
  open,
  onOpenChange,
  enabledKinds,
  onPick,
}: PosItemPickerDialogProps) {
  const dispatch = useAppDispatch()
  const catalog = useAppSelector((s) => s.companyCatalog)
  const tabs = useMemo(
    () => TABS.filter((tab) => enabledKinds.includes(tab.kind)),
    [enabledKinds],
  )
  const [tabKind, setTabKind] = useState<SaleItemKind>(tabs[0]?.kind ?? 'product')
  const [search, setSearch] = useState('')

  const activeTab = tabs.find((tab) => tab.kind === tabKind) ?? tabs[0]

  useEffect(() => {
    if (!open || !activeTab) return
    dispatch(companyCatalogActions.listRequested({ kind: activeTab.catalogKind, q: search }))
  }, [open, activeTab, dispatch, search])

  useEffect(() => {
    if (tabs.length === 0) return
    if (!tabs.some((tab) => tab.kind === tabKind)) {
      setTabKind(tabs[0].kind)
    }
  }, [tabs, tabKind])

  const items = catalog.kind === activeTab?.catalogKind ? catalog.items : []
  const loading = catalog.listStatus === 'loading'

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add item"
      description="Choose a product, service, or space from the company catalog."
      sizeWidth="large"
      sizeHeight="large"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.kind}
              type="button"
              size="sm"
              variant={tab.kind === tabKind ? 'default' : 'outline'}
              onClick={() => setTabKind(tab.kind)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search catalog"
          aria-label="Search catalog"
        />
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <ItemListEmpty>No catalog items in this category.</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      if (!activeTab) return
                      onPick(item, activeTab.kind)
                      onOpenChange(false)
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.listPrice != null ? formatLkr(item.listPrice) : 'Price at checkout'}
                      </p>
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
