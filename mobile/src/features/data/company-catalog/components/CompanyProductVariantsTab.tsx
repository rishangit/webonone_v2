import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  ConfirmDialog,
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
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import { isDataProductVariantWriteTool } from '@/features/ai/utils/catalogAiMutationRefresh'
import { CompanyProductVariantsAiMenu } from '@/features/data/company-catalog/components/CompanyProductVariantsAiMenu'
import { companyProductVariantDetailPath } from '@/features/data/utils/dataPaths'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '@/features/sales/services/dataLibraryApi'

export function CompanyProductVariantsTab({
  productId,
  productName,
  libraryEntityId,
  canEdit,
}: {
  productId: string
  productName: string
  libraryEntityId: string | null
  canEdit: boolean
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<LibraryProductVariant[]>([])
  const [loading, setLoading] = useState(Boolean(libraryEntityId))
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<LibraryProductVariant | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!libraryEntityId) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await dataLibraryApi.listProductVariants(libraryEntityId)
      setItems(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantsTab.failedLoad'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [libraryEntityId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (isDataProductVariantWriteTool(toolName)) {
        void load()
      }
    })
  }, [load])

  async function handleDelete() {
    if (!libraryEntityId || !pendingDelete || pendingDelete.isDefault) return
    setBusy(true)
    try {
      await dataLibraryApi.deleteProductVariant(libraryEntityId, pendingDelete.id)
      toast({ title: tc('remove') })
      await load()
    } catch (err) {
      toast({
        title: tc('remove'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
      setPendingDelete(null)
    }
  }

  if (!libraryEntityId) {
    return <Muted className="text-sm">{t('variantsTab.noLibraryProduct')}</Muted>
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-2">
        <Subheading>{t('detail.tabs.variants')}</Subheading>
        <CompanyProductVariantsAiMenu libraryEntityId={libraryEntityId} entityName={productName} />
      </View>
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {loading ? (
        <ItemListEmpty>{t('variantsTab.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('variantsTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList className="py-0" nestedInCard>
          {items.map((variant) => (
            <ItemListItem
              key={variant.id}
              onPress={() => router.push(companyProductVariantDetailPath(productId, variant.id))}
            >
              <ItemListContent
                title={variant.name}
                subtitle={[
                  `SKU: ${variant.sku}`,
                  variant.values.length > 0
                    ? variant.values
                        .map((value) =>
                          formatLibraryAttributeValueLabel(
                            { valueText: value.valueText, valueNumber: value.valueNumber },
                            value.unitSymbol,
                          ),
                        )
                        .join(' · ')
                    : '',
                ]
                  .filter(Boolean)
                  .join('\n')}
              />
              {variant.isDefault ? (
                <StatusTag variant="verified">{t('variantDetail.variantCard.default')}</StatusTag>
              ) : null}
              {canEdit && !variant.isDefault ? (
                <ItemListMenu ariaLabel={t('variantsTab.actionsFor', { name: variant.name })}>
                  <ItemListMenuItem destructive onPress={() => setPendingDelete(variant)}>
                    {tc('remove')}
                  </ItemListMenuItem>
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}
      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={
          pendingDelete
            ? t('variantDetail.deleteConfirm', { name: pendingDelete.name })
            : t('variantDetail.deleteConfirmFallback')
        }
        description={t('variantDetail.deleteDescription')}
        confirmLabel={tc('remove')}
        destructive
        busy={busy}
        onConfirm={() => void handleDelete()}
      />
    </View>
  )
}
