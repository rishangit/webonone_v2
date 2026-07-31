import { useCallback, useEffect, useState } from 'react'
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

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export function ProductVariantStocksCard({
  productId,
  variantId,
  canEdit,
}: ProductVariantStocksCardProps) {
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
      setError(err instanceof Error ? err.message : 'Failed to load stocks')
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
      toast({ title: 'Active stock updated' })
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set active stock'
      setError(message)
      toast({ title: 'Could not update active stock', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">Stocks</CardTitle>
          <CardDescription>
            Batch inventory for this variant SKU. One batch is the active stock.
          </CardDescription>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)} disabled={loading || saving}>
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading && items.length === 0 ? (
          <ItemListEmpty>Loading stocks…</ItemListEmpty>
        ) : items.length === 0 ? (
          <ItemListEmpty>No stock batches yet. Add a batch to get started.</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((stock) => (
              <ItemListItem key={stock.id}>
                <ItemListContent>
                  <div className="space-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">
                        Batch {stock.batchNumber}
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          · Qty {formatMoney(stock.quantity)}
                        </span>
                      </p>
                      {stock.isActive ? (
                        <StatusTag variant="verified" className="shrink-0">
                          Active
                        </StatusTag>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      Cost {formatMoney(stock.costPrice)} · Sell {formatMoney(stock.sellPrice)}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      Purchased {formatDate(stock.purchaseDate)}
                      {stock.expiredDate ? ` · Expires ${formatDate(stock.expiredDate)}` : ''}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      Supplier · {stock.supplierDisplayName}
                      {stock.supplierEmail ? ` · ${stock.supplierEmail}` : ''}
                    </p>
                  </div>
                </ItemListContent>
                {canEdit && !stock.isActive ? (
                  <ItemListMenu ariaLabel={`Actions for batch ${stock.batchNumber}`}>
                    <DropdownMenuItem
                      disabled={saving}
                      onClick={() => void handleSetActive(stock)}
                    >
                      Set as active
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
