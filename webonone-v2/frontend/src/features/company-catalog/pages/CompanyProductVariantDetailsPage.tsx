import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  ReadOnlyField,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { CompanyProductVariantStockLimitsCard } from '@/features/company-catalog/components/CompanyProductVariantStockLimitsCard'
import { CompanyProductVariantStocksCard } from '@/features/company-catalog/components/CompanyProductVariantStocksCard'
import { CompanyProductVariantAttributeValuesCard } from '@/features/company-catalog/components/CompanyProductVariantAttributeValuesCard'
import { CompanyProductVariantSummaryCard } from '@/features/company-catalog/components/CompanyProductVariantSummaryCard'
import { useLibraryProductVariantStocks } from '@/features/company-catalog/hooks/useLibraryProductVariantStocks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companyCatalogApi, type CompanyCatalogVariant } from '../services/companyCatalogApi'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'

export function CompanyProductVariantDetailsPage() {
  const { t, i18n } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { productId = '', variantId = '' } = useParams()
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const canEdit = activeRole === 'company_admin'
  const canAddStock = activeRole === 'company_admin'
  const [variant, setVariant] = useState<CompanyCatalogVariant | null>(null)
  const [libraryProductId, setLibraryProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!productId || !variantId) return
    setLoading(true)
    setError(null)
    try {
      const product = await companyCatalogApi.get('products', productId)
      setLibraryProductId(product.libraryEntityId)
      const result = await companyCatalogApi.getCopiedVariant(productId, variantId)
      setVariant(result)
    } catch (err) {
      setVariant(null)
      setLibraryProductId(null)
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

  if (!productId || !variantId) {
    return <Navigate to="/data/products" replace />
  }

  return (
    <FeaturePage
      title={variant?.name ?? t('variantDetail.titleFallback')}
      description={t('variantDetail.description')}
      onBack={() => navigate(`/data/products/${productId}?tab=variants`)}
      backLabel={tc('back')}
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

            <CompanyProductVariantAttributeValuesCard
              productId={productId}
              variant={variant}
              canEdit={canEdit}
              onVariantUpdated={setVariant}
            />

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
    </FeaturePage>
  )
}
