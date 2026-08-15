import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
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
  StatusTag,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { ProductVariantStocksCard } from '@/features/products/components/ProductVariantStocksCard'
import { formatAttributeValueLabel } from '@/features/products/schemas/productVariantSchemas'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { dataApi } from '@/shared/services/dataApi'
import type { ProductVariant } from '@/shared/types/data.types'

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function ProductVariantDetailsPage() {
  const { t } = useTranslation('products')
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>()
  const { goToDetail } = useNavigateDataEntity()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canAddStock = user?.role === 'company_admin'
  const [variant, setVariant] = useState<ProductVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!productId || !variantId) return
    setLoading(true)
    setError(null)
    try {
      const result = await dataApi.getProductVariant(productId, variantId)
      setVariant(result)
    } catch (err) {
      setVariant(null)
      setError(err instanceof Error ? err.message : t('variant.loadDetailFailed'))
    } finally {
      setLoading(false)
    }
  }, [productId, variantId])

  useEffect(() => {
    void load()
  }, [load])

  usePlatformLoading(loading && !variant ? t('loadingVariant') : null)

  if (!accessToken) return <Navigate to="/login" replace />
  if (!productId || !variantId) return <Navigate to="/products" replace />

  return (
    <FeaturePage
      title={variant?.name ?? t('variant.singular')}
      description={t('variantDetails')}
      onBack={() => goToDetail('products', productId, { tab: 'variants' })}
      backLabel={t('common:back')}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {variant ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title={t('variant.singular')}
              description={t('variant.sectionDescription')}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{variant.name}</h2>
                {variant.isDefault ? (
                  <StatusTag variant="verified" className="shrink-0">
                    {t('variant.default')}
                  </StatusTag>
                ) : null}
              </div>
              <ReadOnlyField label={t('variant.sku')} value={variant.sku} />
            </EditableSectionCard>

            <ProductVariantStocksCard
              productId={productId}
              variantId={variantId}
              canEdit={canAddStock}
            />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <EditableSectionCard
              title={t('variant.attributeValues')}
              description={t('variant.attributeValuesDescription')}
            >
              {variant.values.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('variant.noAttributeValues')}</p>
              ) : (
                <div className="space-y-4">
                  {variant.values.map((value) => (
                    <ReadOnlyField
                      key={`${value.attributeId}-${value.attributeValueId}`}
                      label={value.attributeName}
                      value={formatAttributeValueLabel(value, value.unitSymbol)}
                    />
                  ))}
                </div>
              )}
            </EditableSectionCard>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('metadata')}</CardTitle>
                <CardDescription>{t('metadataTimestamps')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label={t('created')} value={formatTimestamp(variant.createdAt)} />
                <ReadOnlyField label={t('updated')} value={formatTimestamp(variant.updatedAt)} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </FeaturePage>
  )
}
