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
  itemListThumbClassName,
  SearchInput,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type { CatalogEntityKind, HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import { catalogItemImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'
import type { SaleItemKind } from '@/features/sales/types/sales.types'
import { formatLkr } from '@/features/sales/utils/formatMoney'

const TABS: Array<{ kind: SaleItemKind; catalogKind: CatalogEntityKind; labelKey: string }> = [
  { kind: 'product', catalogKind: 'products', labelKey: 'pos.pickerTabProducts' },
  { kind: 'service', catalogKind: 'services', labelKey: 'pos.pickerTabServices' },
  { kind: 'space', catalogKind: 'spaces', labelKey: 'pos.pickerTabSpaces' },
]

type PosItemPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabledKinds: SaleItemKind[]
  onPick: (item: HydratedCatalogItem, itemKind: SaleItemKind) => void
  /** Stacked inside another dialog (session workflow sale dialog). */
  stackLevel?: number
}

export function PosItemPickerDialog({
  open,
  onOpenChange,
  enabledKinds,
  onPick,
  stackLevel,
}: PosItemPickerDialogProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
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
      title={t('pos.pickerTitle')}
      description={t('pos.pickerDescription')}
      sizeWidth="large"
      sizeHeight="large"
      stackLevel={stackLevel}
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('close')}
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
              {t(tab.labelKey)}
            </Button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder={t('pos.pickerSearchPlaceholder')}
          aria-label={t('pos.pickerSearchAria')}
        />
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <ItemListEmpty>{t('pos.pickerEmpty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      if (!activeTab) return
                      onPick(item, activeTab.kind)
                      onOpenChange(false)
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
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {activeTab ? <span>{t(`kinds.${activeTab.kind}`)}</span> : null}
                        <span>
                          {item.listPrice != null
                            ? formatLkr(item.listPrice)
                            : t('pos.priceAtCheckout')}
                        </span>
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
