import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  StatusTag,
  useToast,
} from '@webonone/mobile-ui'
import { ProductVariantFormDialog } from '@/features/data/components/ProductVariantFormDialog'
import { formatAttributeValueLabel } from '@/features/data/schemas/productVariantSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogAttributeValue, ProductVariant } from '@/shared/types/data.types'

export function ProductVariantsTab({
  productId,
  productName,
  attributes,
  canEdit,
}: {
  productId: string
  productName: string
  attributes: CatalogAttributeValue[]
  canEdit: boolean
}) {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [items, setItems] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ProductVariant | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await dataAdminApi.listProductVariants(productId)
      setItems(result.items)
    } catch (err) {
      toast({
        title: t('variant.loadFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [productId, t, toast])

  useEffect(() => {
    void load()
  }, [load])

  const hasDefaultVariant = items.some((item) => item.isDefault)

  async function handleDeleteVariant(variant: ProductVariant) {
    setBusy(true)
    try {
      await dataAdminApi.deleteProductVariant(productId, variant.id)
      setPendingDelete(null)
      await load()
    } catch (err) {
      toast({
        title: t('variant.deleteFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Body className="text-lg font-medium">{t('variants')}</Body>
          <Body className="text-sm text-muted">{t('variant.tabDescription')}</Body>
        </View>
        {canEdit ? (
          <Button size="sm" onPress={() => setDialogOpen(true)} disabled={loading}>
            {t('variant.addNew')}
          </Button>
        ) : null}
      </View>

      {loading && items.length === 0 ? (
        <ItemListEmpty>{t('variant.loadingList')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('variant.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((variant) => {
            const valuesLine =
              variant.values.length > 0
                ? variant.values
                    .map(
                      (value) =>
                        `${value.attributeName}: ${formatAttributeValueLabel(value, value.unitSymbol)}`,
                    )
                    .join(' · ')
                : null
            return (
              <ItemListItem key={variant.id}>
                <View className="min-w-0 flex-1 gap-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Body className="text-sm font-semibold">{variant.name}</Body>
                    {variant.isDefault ? (
                      <StatusTag variant="verified">{t('variant.default')}</StatusTag>
                    ) : null}
                  </View>
                  <Body className="text-sm text-muted">
                    {t('variant.skuLine', { sku: variant.sku })}
                  </Body>
                  {valuesLine ? <Body className="text-sm text-muted">{valuesLine}</Body> : null}
                </View>
                {canEdit && !variant.isDefault ? (
                  <ItemListMenu ariaLabel={t('variant.actionsFor', { name: variant.name })}>
                    <ItemListMenuItem
                      destructive
                      disabled={busy}
                      onPress={() => setPendingDelete(variant)}
                    >
                      {tc('delete')}
                    </ItemListMenuItem>
                  </ItemListMenu>
                ) : null}
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
          onOpenChange={setDialogOpen}
          onSaved={() => {
            void load()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={
          pendingDelete
            ? t('variant.deleteConfirm', { name: pendingDelete.name })
            : t('variant.deleteConfirmFallback')
        }
        description={t('variant.deleteDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={busy}
        onConfirm={() => {
          if (pendingDelete) void handleDeleteVariant(pendingDelete)
        }}
      />
    </View>
  )
}
