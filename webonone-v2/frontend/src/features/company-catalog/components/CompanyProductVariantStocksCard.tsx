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
import { CompanyStockFormDialog } from '@/features/company-catalog/components/CompanyStockFormDialog'
import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

type CompanyProductVariantStocksCardProps = {
  /** Data library product id */
  libraryProductId: string
  variantId: string
  canEdit: boolean
}

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
}: CompanyProductVariantStocksCardProps) {
  const { t, i18n } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [items, setItems] = useState<LibraryProductVariantStock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">{t('stocks.title')}</CardTitle>
          <CardDescription>{t('stocks.description')}</CardDescription>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)} disabled={loading || saving}>
            <Plus className="h-4 w-4" aria-hidden />
            {tc('add')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading && items.length === 0 ? (
          <ItemListEmpty>{t('stocks.loading')}</ItemListEmpty>
        ) : items.length === 0 ? (
          <ItemListEmpty>{t('stocks.empty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((stock) => (
              <ItemListItem key={stock.id}>
                <ItemListContent>
                  <div className="space-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">
                        {t('stocks.batchLabel', { number: stock.batchNumber })}
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          · {t('stocks.qty', { qty: formatMoney(stock.quantity) })}
                        </span>
                      </p>
                      {stock.isActive ? (
                        <StatusTag variant="verified" className="shrink-0">
                          {t('stocks.active')}
                        </StatusTag>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {t('stocks.costSell', {
                        cost: formatMoney(stock.costPrice),
                        sell: formatMoney(stock.sellPrice),
                      })}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t('stocks.purchased', { date: formatCalendarYmd(stock.purchaseDate, i18n.language) })}
                      {stock.expiredDate
                        ? ` · ${t('stocks.expires', { date: formatCalendarYmd(stock.expiredDate, i18n.language) })}`
                        : ''}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t('stocks.supplier', { name: stock.supplierDisplayName })}
                      {stock.supplierEmail ? ` · ${stock.supplierEmail}` : ''}
                    </p>
                  </div>
                </ItemListContent>
                {canEdit && !stock.isActive ? (
                  <ItemListMenu ariaLabel={t('stocks.actionsAria', { number: stock.batchNumber })}>
                    <DropdownMenuItem
                      disabled={saving}
                      onClick={() => void handleSetActive(stock)}
                    >
                      {t('stocks.setAsActive')}
                    </DropdownMenuItem>
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            ))}
          </ItemList>
        )}
      </CardContent>

      {dialogOpen ? (
        <CompanyStockFormDialog
          open
          libraryProductId={libraryProductId}
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
