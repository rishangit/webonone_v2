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
  ListAddButton,
  Muted,
  StatusTag,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import { isDataProductVariantWriteTool } from '@/features/ai/utils/catalogAiMutationRefresh'
import { CompanyProductVariantPickerDialog } from '@/features/data/company-catalog/components/CompanyProductVariantPickerDialog'
import { companyProductVariantDetailPath } from '@/features/data/utils/dataPaths'
import {
  companyCatalogApi,
  type CompanyCatalogVariant,
} from '@/features/data/services/companyCatalogApi'
import { formatLibraryAttributeValueLabel } from '@/features/sales/services/dataLibraryApi'

export function CompanyProductVariantsTab({
  productId,
  productName,
  libraryEntityId,
  canAdd,
}: {
  productId: string
  productName: string
  libraryEntityId: string | null
  canAdd: boolean
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<CompanyCatalogVariant[]>([])
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(libraryEntityId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CompanyCatalogVariant | null>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listCopiedVariants(productId)
      setItems(result.items)
      setLinkedLibraryId(result.libraryEntityId ?? libraryEntityId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantsTab.failedLoad'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [libraryEntityId, productId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (isDataProductVariantWriteTool(toolName)) void load()
    })
  }, [load])

  async function handleDelete() {
    if (!pendingDelete || pendingDelete.isDefault) return
    setBusy(true)
    try {
      await companyCatalogApi.deleteCopiedVariant(productId, pendingDelete.id)
      toast({ title: t('variantsTab.removed') })
      await load()
    } catch (err) {
      toast({
        title: t('variantsTab.removeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
      setPendingDelete(null)
    }
  }

  return (
    <View className="gap-4">
      <View className="gap-3">
        <View className="min-w-0 gap-1">
          <Subheading>{t('detail.tabs.variants')}</Subheading>
          <Muted className="text-sm">{t('variantsTab.copiedHint')}</Muted>
        </View>
        {canAdd ? (
          <View className="items-end">
            <ListAddButton onPress={() => setPickerOpen(true)} disabled={loading || busy}>
              {t('variantsTab.add')}
            </ListAddButton>
          </View>
        ) : null}
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
              {canAdd && !variant.isDefault ? (
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
      <CompanyProductVariantPickerDialog
        open={pickerOpen}
        productId={productId}
        productName={productName}
        libraryEntityId={linkedLibraryId}
        copiedVariants={items}
        onOpenChange={setPickerOpen}
        onCopied={(nextLibraryId) => {
          if (nextLibraryId) setLinkedLibraryId(nextLibraryId)
          void load()
        }}
      />
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
