import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  Muted,
  StatusTag,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { CompanyStockFormDialog } from '@/features/data/company-catalog/components/CompanyStockFormDialog'
import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/sales/services/dataLibraryApi'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
}

export function CompanyProductVariantStocksCard({
  libraryProductId,
  variantId,
  canEdit,
}: {
  libraryProductId: string
  variantId: string
  canEdit: boolean
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [items, setItems] = useState<LibraryProductVariantStock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<LibraryProductVariantStock | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dataLibraryApi.listProductVariantStocks(libraryProductId, variantId)
      setItems(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('stocks.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [libraryProductId, variantId, t])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSetActive(stock: LibraryProductVariantStock) {
    if (stock.isActive || saving) return
    setSaving(true)
    setError(null)
    try {
      await dataLibraryApi.setProductVariantStockActive(libraryProductId, variantId, stock.id)
      toast({ title: t('stocks.toastActiveUpdated') })
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('stocks.failedSetActive')
      setError(message)
      toast({ title: t('stocks.toastActiveFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1 gap-1">
          <Subheading>{t('stocks.title')}</Subheading>
          <Muted>{t('stocks.description')}</Muted>
        </View>
        {canEdit ? (
          <Button
            size="sm"
            disabled={loading || saving}
            onPress={() => {
              setEditingStock(null)
              setDialogOpen(true)
            }}
          >
            {tc('add')}
          </Button>
        ) : null}
      </View>

      {error ? <Body className="text-sm text-destructive">{error}</Body> : null}

      {loading && items.length === 0 ? (
        <ItemListEmpty>{t('stocks.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('stocks.empty')}</ItemListEmpty>
      ) : (
        <ItemList className="py-0" nestedInCard>
          {items.map((stock) => (
            <ItemListItem key={stock.id}>
              <ItemListContent
                title={`${t('stocks.batchLabel', { number: stock.batchNumber })} · ${t('stocks.qty', { qty: formatMoney(stock.quantity) })}`}
                subtitle={[
                  t('stocks.costSell', {
                    cost: formatMoney(stock.costPrice),
                    sell: formatMoney(stock.sellPrice),
                  }),
                  `${t('stocks.purchased', { date: formatCalendarYmd(stock.purchaseDate) })}${
                    stock.expiredDate
                      ? ` · ${t('stocks.expires', { date: formatCalendarYmd(stock.expiredDate) })}`
                      : ''
                  }`,
                  stock.supplierDisplayName
                    ? `${t('stocks.supplier', { name: stock.supplierDisplayName })}${stock.supplierEmail ? ` · ${stock.supplierEmail}` : ''}`
                    : '',
                ]
                  .filter(Boolean)
                  .join('\n')}
              />
              {stock.isActive ? <StatusTag variant="verified">{t('stocks.active')}</StatusTag> : null}
              {canEdit ? (
                <ItemListMenu ariaLabel={t('stocks.actionsAria', { number: stock.batchNumber })}>
                  <ItemListMenuItem
                    onPress={() => {
                      setEditingStock(stock)
                      setDialogOpen(true)
                    }}
                  >
                    {tc('edit')}
                  </ItemListMenuItem>
                  {!stock.isActive ? (
                    <ItemListMenuItem disabled={saving} onPress={() => void handleSetActive(stock)}>
                      {t('stocks.setAsActive')}
                    </ItemListMenuItem>
                  ) : null}
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}

      {dialogOpen ? (
        <CompanyStockFormDialog
          open
          libraryProductId={libraryProductId}
          variantId={variantId}
          stock={editingStock}
          onOpenChange={(next) => {
            setDialogOpen(next)
            if (!next) setEditingStock(null)
          }}
          onSaved={() => void load()}
        />
      ) : null}
    </Card>
  )
}
