import { useState } from 'react'
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
  StockAvailabilityProgress,
  StockBatchPriceRow,
  useToast,
} from '@webonone/ui-kit'
import { CompanyStockFormDialog } from '@/features/company-catalog/components/CompanyStockFormDialog'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

type CompanyProductVariantStocksCardProps = {
  libraryProductId: string
  variantId: string
  companyProductId: string
  items: LibraryProductVariantStock[]
  loading: boolean
  error: string | null
  onReload: () => void
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
  companyProductId,
  items,
  loading,
  error,
  onReload,
  canEdit,
}: CompanyProductVariantStocksCardProps) {
  const { t, i18n } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { byVariantId } = useCompanyProductVariantStockLimitsMap(companyProductId)
  const limits = byVariantId[variantId]
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<LibraryProductVariantStock | null>(null)

  async function handleSetActive(stock: LibraryProductVariantStock) {
    if (stock.isActive || saving) return
    setSaving(true)
    try {
      await dataLibraryApi.setProductVariantStockActive(libraryProductId, variantId, stock.id)
      toast({ title: t('stocks.toastActiveUpdated') })
      onReload()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('stocks.failedSetActive')
      toast({ title: t('stocks.toastActiveFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="list">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">{t('stocks.title')}</CardTitle>
          <CardDescription>{t('stocks.description')}</CardDescription>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={() => {
              setEditingStock(null)
              setDialogOpen(true)
            }}
            disabled={loading || saving}
          >
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
          <ItemList className="py-0">
            {items.map((stock) => (
              <ItemListItem key={stock.id}>
                <ItemListContent>
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">
                        {t('stocks.batchLabel', { number: stock.batchNumber })}
                      </p>
                      {stock.isActive ? (
                        <StatusTag variant="verified" className="shrink-0">
                          {t('stocks.active')}
                        </StatusTag>
                      ) : null}
                    </div>
                    <StockAvailabilityProgress
                      quantity={stock.quantity}
                      maxQuantity={limits?.maxQuantity}
                      minQuantity={limits?.minQuantity}
                      caption={t('stocks.qty', { qty: formatMoney(stock.quantity) })}
                    />
                    <p className="truncate text-sm text-muted-foreground">
                      {t('stocks.purchased', {
                        date: formatCalendarYmd(stock.purchaseDate, i18n.language),
                      })}
                      {stock.expiredDate
                        ? ` · ${t('stocks.expires', {
                            date: formatCalendarYmd(stock.expiredDate, i18n.language),
                          })}`
                        : ''}
                    </p>
                    {stock.supplierDisplayName ? (
                      <p className="truncate text-sm text-muted-foreground">
                        {t('stocks.supplier', { name: stock.supplierDisplayName })}
                        {stock.supplierEmail ? ` · ${stock.supplierEmail}` : ''}
                      </p>
                    ) : null}
                    <StockBatchPriceRow
                      className="pt-1"
                      costLabel={t('stocks.cost')}
                      sellLabel={t('stocks.sell')}
                      costValue={formatMoney(stock.costPrice)}
                      sellValue={formatMoney(stock.sellPrice)}
                    />
                  </div>
                </ItemListContent>
                {canEdit ? (
                  <ItemListMenu ariaLabel={t('stocks.actionsAria', { number: stock.batchNumber })}>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingStock(stock)
                        setDialogOpen(true)
                      }}
                    >
                      {tc('edit')}
                    </DropdownMenuItem>
                    {!stock.isActive ? (
                      <DropdownMenuItem
                        disabled={saving}
                        onClick={() => void handleSetActive(stock)}
                      >
                        {t('stocks.setAsActive')}
                      </DropdownMenuItem>
                    ) : null}
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
          stock={editingStock}
          onOpenChange={(next) => {
            setDialogOpen(next)
            if (!next) setEditingStock(null)
          }}
          onSaved={() => {
            toast({ title: editingStock ? t('stocks.toastUpdated') : t('stocks.toastCreated') })
            onReload()
          }}
        />
      ) : null}
    </Card>
  )
}
