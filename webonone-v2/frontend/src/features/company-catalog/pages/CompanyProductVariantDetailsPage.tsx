import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EditableSectionCard,
  FeaturePage,
  ReadOnlyField,
  useToast,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CompanyProductVariantStockLimitsCard } from '@/features/company-catalog/components/CompanyProductVariantStockLimitsCard'
import { CompanyProductVariantStocksCard } from '@/features/company-catalog/components/CompanyProductVariantStocksCard'
import { CompanyProductVariantSummaryCard } from '@/features/company-catalog/components/CompanyProductVariantSummaryCard'
import { useLibraryProductVariantStocks } from '@/features/company-catalog/hooks/useLibraryProductVariantStocks'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companyCatalogApi } from '../services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '../services/dataLibraryApi'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'

export function CompanyProductVariantDetailsPage() {
  const { t, i18n } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()
  const { productId = '', variantId = '' } = useParams()
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const canEdit = activeRole === 'company_admin'
  const canAddStock = activeRole === 'company_admin'
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
      setProductName(typeof product.name === 'string' ? product.name.trim() : '')
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

  usePlatformLoading(loading && !variant ? t('variantDetail.loading') : null)

  const stocksQuery = useLibraryProductVariantStocks(productId, variantId)

  async function handleDelete() {
    if (!libraryProductId || !variantId || !variant || variant.isDefault) return
    setDeleting(true)
    setError(null)
    try {
      await dataLibraryApi.deleteProductVariant(libraryProductId, variantId)
      navigate(`/data/products/${productId}?tab=variants`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantDetail.deleteFailed'))
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (!productId || !variantId) {
    return <Navigate to="/data/products" replace />
  }

  return (
    <FeaturePage
      title={variant?.name ?? t('variantDetail.titleFallback')}
      description={t('variantDetail.description')}
      onBack={() => navigate(`/data/products/${productId}?tab=variants`)}
      backLabel={tc('back')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {variant ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                requestEntityPaste({
                  entities: [
                    {
                      service: 'webonone',
                      kind: 'product',
                      id: productId,
                      label: productName || variant.name,
                    },
                  ],
                  composerText: `Focus on variant "${variant.name}" (variantId: ${variantId}). List existing stocks with list_company_product_variant_stocks, then suggest or create stock batches with create_company_product_variant_stock when asked.`,
                })
                toast({ title: t('attributesTab.copyToAiSuccess') })
              }}
            >
              {t('attributesTab.copyToAi')}
            </Button>
          ) : null}
          {canEdit && variant && !variant.isDefault ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
            >
              {tc('delete')}
            </Button>
          ) : null}
        </div>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {variant && libraryProductId ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <CompanyProductVariantSummaryCard
              variant={variant}
              companyProductId={productId}
              totalQuantity={stocksQuery.totalQuantity}
              stocksLoading={stocksQuery.loading}
            />

            <CompanyProductVariantStocksCard
              variantId={variantId}
              companyProductId={productId}
              items={stocksQuery.items}
              loading={stocksQuery.loading}
              error={stocksQuery.error}
              onReload={stocksQuery.reload}
              canEdit={canAddStock}
            />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <CompanyProductVariantStockLimitsCard
              companyProductId={productId}
              libraryVariantId={variantId}
              canEdit={canEdit}
            />

            <EditableSectionCard
              title={t('variantDetail.attributeValues.title')}
              description={t('variantDetail.attributeValues.description')}
            >
              {variant.values.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('variantDetail.attributeValues.empty')}</p>
              ) : (
                <div className="space-y-4">
                  {variant.values.map((value) => (
                    <ReadOnlyField
                      key={`${value.attributeId}-${value.attributeValueId}`}
                      label={value.attributeName}
                      value={formatLibraryAttributeValueLabel(value, value.unitSymbol)}
                    />
                  ))}
                </div>
              )}
            </EditableSectionCard>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('variantDetail.meta.title')}</CardTitle>
                <CardDescription>{t('variantDetail.meta.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField
                  label={t('variantDetail.created')}
                  value={formatLocaleDateTime(variant.createdAt, i18n.language)}
                />
                <ReadOnlyField
                  label={t('variantDetail.updated')}
                  value={formatLocaleDateTime(variant.updatedAt, i18n.language)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <PlatformAlertConfirmDialog
        open={deleteOpen}
        title={
          variant
            ? t('variantDetail.deleteConfirm', { name: variant.name })
            : t('variantDetail.deleteConfirmFallback')
        }
        description={t('variantDetail.deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('delete')}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleDelete()
        }}
      />
    </FeaturePage>
  )
}
