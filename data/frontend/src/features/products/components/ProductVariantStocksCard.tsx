import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { StockFormDialog } from '@/features/products/components/StockFormDialog'
import { dataApi } from '@/shared/services/dataApi'
import type { ProductVariantStock } from '@/shared/types/data.types'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

type ProductVariantStocksCardProps = {
  productId: string
  variantId: string
  canEdit: boolean
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
}

export function ProductVariantStocksCard({
  productId,
  variantId,
  canEdit,
}: ProductVariantStocksCardProps) {
  const { t } = useTranslation('products')
  const { toast } = useToast()
  const [items, setItems] = useState<ProductVariantStock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dataApi.listProductVariantStocks(productId, variantId)
      setItems(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('stock.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [productId, variantId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSetActive(stock: ProductVariantStock) {
    if (stock.isActive || saving) return
    setSaving(true)
    setError(null)
    try {
      await dataApi.setProductVariantStockActive(productId, variantId, stock.id)
      toast({ title: t('stock.activeUpdated') })
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('stock.setActiveFailed')
      setError(message)
      toast({ title: t('stock.activeUpdateFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">{t('stock.title')}</CardTitle>
          <CardDescription>
            {t('stock.description')}
          </CardDescription>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)} disabled={loading || saving}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('stock.add')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading && items.length === 0 ? (
          <ItemListEmpty>{t('stock.loading')}</ItemListEmpty>
        ) : items.length === 0 ? (
          <ItemListEmpty>{t('stock.empty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((stock) => (
              <ItemListItem key={stock.id}>
                <ItemListContent>
                  <div className="space-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">
                        {t('stock.batchQty', { number: stock.batchNumber, qty: formatMoney(stock.quantity) })}
                      </p>
                      {stock.isActive ? (
                        <StatusTag variant="verified" className="shrink-0">
                          {t('stock.active')}
                        </StatusTag>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {t('stock.costSell', { cost: formatMoney(stock.costPrice), sell: formatMoney(stock.sellPrice) })}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t('stock.purchased', { date: formatCalendarYmd(stock.purchaseDate) })}
                      {stock.expiredDate ? t('stock.expires', { date: formatCalendarYmd(stock.expiredDate) }) : ''}
                    </p>
                    {stock.supplierDisplayName ? (
                      <p className="truncate text-sm text-muted-foreground">
                        {t('stock.supplierLine', { name: stock.supplierDisplayName })}
                        {stock.supplierEmail ? ` · ${stock.supplierEmail}` : ''}
                      </p>
                    ) : null}
                  </div>
                </ItemListContent>
                {canEdit && !stock.isActive ? (
                  <ItemListMenu ariaLabel={t('stock.actionsForBatch', { number: stock.batchNumber })}>
                    <DropdownMenuItem
                      disabled={saving}
                      onClick={() => void handleSetActive(stock)}
                    >
                      {t('stock.setActive')}
                    </DropdownMenuItem>
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            ))}
          </ItemList>
        )}
      </CardContent>

      {dialogOpen ? (
        <StockFormDialog
          open
          productId={productId}
          variantId={variantId}
          onOpenChange={setDialogOpen}
          onSaved={() => {
            void load()
          }}
        />
      ) : null}
    </Card>
  )
}
