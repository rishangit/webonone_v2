import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  ConfirmDialog,
  EditableSectionCard,
  FeatureScreen,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { CompanyProductVariantStocksCard } from '@/features/data/company-catalog/components/CompanyProductVariantStocksCard'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import { catalogDetailPath } from '@/features/data/utils/dataPaths'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '@/features/sales/services/dataLibraryApi'
import { hydrateCatalogItems } from '@/features/sales/utils/hydrateCatalogItems'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

export function CompanyProductVariantDetailScreen({
  productId,
  variantId,
}: {
  productId: string
  variantId: string
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()
  const { canManageCompanyCatalog } = useDataCatalogScope()
  const canEdit = canManageCompanyCatalog
  const canAddStock = canManageCompanyCatalog

  const [variant, setVariant] = useState<LibraryProductVariant | null>(null)
  const [libraryProductId, setLibraryProductId] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!productId || !variantId) return
    setLoading(true)
    setError(null)
    try {
      const product = await companyCatalogApi.get('products', productId)
      if (!product.libraryEntityId) {
        setVariant(null)
        setLibraryProductId(null)
        setProductName('')
        setError(t('variantDetail.notLinked'))
        return
      }
      setLibraryProductId(product.libraryEntityId)
      const [hydrated] = await hydrateCatalogItems('products', [product])
      setProductName(hydrated?.displayName?.trim() ?? '')
      const result = await dataLibraryApi.getProductVariant(product.libraryEntityId, variantId)
      setVariant(result)
    } catch (err) {
      setVariant(null)
      setLibraryProductId(null)
      setProductName('')
      setError(err instanceof Error ? err.message : t('variantDetail.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [productId, variantId, t])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete() {
    if (!libraryProductId || !variantId || !variant || variant.isDefault) return
    setDeleting(true)
    setError(null)
    try {
      await dataLibraryApi.deleteProductVariant(libraryProductId, variantId)
      toast({ title: tc('remove') })
      router.replace(catalogDetailPath('products', productId))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('variantDetail.deleteFailed')
      setError(message)
      toast({ title: t('variantDetail.deleteFailed'), description: message, variant: 'destructive' })
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  function handleCopyToAi() {
    if (!variant || !libraryProductId) return
    requestEntityPaste({
      entities: [
        {
          service: 'data',
          kind: 'product',
          id: libraryProductId,
          label: productName || variant.name,
        },
      ],
      composerText: `Focus on variant "${variant.name}" (variantId: ${variantId}). List existing stocks with list_data_product_variant_stocks, then suggest or create stock batches with create_data_product_variant_stock when asked.`,
    })
    toast({ title: t('attributesTab.copyToAiSuccess') })
  }

  const actions =
    variant && libraryProductId ? (
      <View className="flex-row flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onPress={handleCopyToAi}>
          {t('attributesTab.copyToAi')}
        </Button>
        {canEdit && !variant.isDefault ? (
          <Button variant="destructive" size="sm" disabled={deleting} onPress={() => setDeleteOpen(true)}>
            {tc('delete')}
          </Button>
        ) : null}
      </View>
    ) : null

  return (
    <FeatureScreen
      title={variant?.name ?? t('variantDetail.titleFallback')}
      description={t('variantDetail.description')}
      onBack={() => router.back()}
      backLabel={tc('back')}
      actions={actions}
    >
      {loading && !variant ? (
        <View className="items-center py-8">
          <Spinner />
          <Muted className="mt-2">{t('variantDetail.loading')}</Muted>
        </View>
      ) : null}

      {error ? <Body className="text-destructive">{error}</Body> : null}

      {variant && libraryProductId ? (
        <View className="gap-6">
          <EditableSectionCard
            title={t('variantDetail.variantCard.title')}
            description={t('variantDetail.variantCard.description')}
          >
            <View className="flex-row flex-wrap items-center gap-2">
              <Subheading>{variant.name}</Subheading>
              {variant.isDefault ? (
                <StatusTag variant="verified">{t('variantDetail.variantCard.default')}</StatusTag>
              ) : null}
            </View>
            <ReadOnlyField label={t('variantDetail.variantCard.sku')} value={variant.sku} />
          </EditableSectionCard>

          <CompanyProductVariantStocksCard
            libraryProductId={libraryProductId}
            variantId={variantId}
            canEdit={canAddStock}
          />

          <EditableSectionCard
            title={t('variantDetail.attributeValues.title')}
            description={t('variantDetail.attributeValues.description')}
          >
            {variant.values.length === 0 ? (
              <Muted className="text-sm">{t('variantDetail.attributeValues.empty')}</Muted>
            ) : (
              <View className="gap-4">
                {variant.values.map((value) => (
                  <ReadOnlyField
                    key={`${value.attributeId}-${value.attributeValueId}`}
                    label={value.attributeName}
                    value={formatLibraryAttributeValueLabel(value, value.unitSymbol)}
                  />
                ))}
              </View>
            )}
          </EditableSectionCard>

          <Card className="gap-4">
            <View className="gap-1">
              <Subheading>{t('variantDetail.meta.title')}</Subheading>
              <Muted className="text-sm">{t('variantDetail.meta.description')}</Muted>
            </View>
            <ReadOnlyField
              label={t('variantDetail.created')}
              value={formatDisplayDateTime(variant.createdAt)}
            />
            <ReadOnlyField
              label={t('variantDetail.updated')}
              value={formatDisplayDateTime(variant.updatedAt)}
            />
          </Card>
        </View>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={
          variant
            ? t('variantDetail.deleteConfirm', { name: variant.name })
            : t('variantDetail.deleteConfirmFallback')
        }
        description={t('variantDetail.deleteDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={deleting}
        onConfirm={() => void handleDelete()}
      />
    </FeatureScreen>
  )
}
