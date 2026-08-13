import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { formatAttributeValueLabel } from '@/features/products/schemas/productVariantSchemas'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogAttributeValue, ProductVariant } from '@/shared/types/data.types'

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
  const { t } = useTranslation('products')
  const { goToVariantDetail } = useNavigateDataEntity()
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
      setError(err instanceof Error ? err.message : t('variant.loadFailed'))
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
          <h2 className="text-lg font-medium text-foreground">{t('variants')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('variant.tabDescription')}
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)} disabled={loading}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('variant.addNew')}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && items.length === 0 ? (
        <ItemListEmpty>{t('variant.loadingList')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('variant.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((variant) => {
            const rowBody = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{variant.name}</p>
                  {variant.isDefault ? (
                    <StatusTag variant="verified" className="shrink-0">
                      {t('variant.default')}
                    </StatusTag>
                  ) : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">{t('variant.skuLine', { sku: variant.sku })}</p>
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
              </>
            )
            return (
              <ItemListItem key={variant.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => goToVariantDetail(productId, variant.id)}
                  >
                    {rowBody}
                  </button>
                </ItemListContent>
              </ItemListItem>
            )
          })}
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
