import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  StatusTag,
} from '@webonone/ui-kit'
import { ProductVariantFormDialog } from '@/features/products/components/ProductVariantFormDialog'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogAttributeValue, ProductVariant } from '@/shared/types/data.types'
import { formatAttributeValueLabel } from '@/features/products/schemas/productVariantSchemas'

type ProductVariantsTabProps = {
  productId: string
  productName: string
  attributes: CatalogAttributeValue[]
  canEdit: boolean
}

export function ProductVariantsTab({
  productId,
  productName,
  attributes,
  canEdit,
}: ProductVariantsTabProps) {
  const [items, setItems] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dataApi.listProductVariants(productId)
      setItems(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variants')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const hasDefaultVariant = items.some((item) => item.isDefault)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">Variants</h2>
          <p className="text-sm text-muted-foreground">
            SKUs built from this product&apos;s attribute values.
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)} disabled={loading}>
            <Plus className="h-4 w-4" aria-hidden />
            Add new variant
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && items.length === 0 ? (
        <ItemListEmpty>Loading variants…</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>No variants yet. Add a default or custom variant to get started.</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((variant) => (
            <ItemListItem key={variant.id}>
              <ItemListContent>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{variant.name}</p>
                  {variant.isDefault ? (
                    <StatusTag variant="verified" className="shrink-0">
                      Default
                    </StatusTag>
                  ) : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">SKU · {variant.sku}</p>
                {variant.values.length > 0 ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {variant.values
                      .map(
                        (value) =>
                          `${value.attributeName}: ${formatAttributeValueLabel(value, value.unitSymbol)}`,
                      )
                      .join(' · ')}
                  </p>
                ) : null}
              </ItemListContent>
            </ItemListItem>
          ))}
        </ItemList>
      )}

      {dialogOpen ? (
        <ProductVariantFormDialog
          open
          productId={productId}
          productName={productName}
          attributes={attributes}
          hasDefaultVariant={hasDefaultVariant}
          existingVariants={items}
          onOpenChange={setDialogOpen}
          onSaved={() => {
            void load()
          }}
        />
      ) : null}
    </div>
  )
}
