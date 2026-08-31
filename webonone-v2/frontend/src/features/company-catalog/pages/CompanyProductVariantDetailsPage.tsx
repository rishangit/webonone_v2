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
  FeaturePage,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CompanyProductVariantStocksCard } from '@/features/company-catalog/components/CompanyProductVariantStocksCard'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { EditableSectionCard } from '../components/EditableSectionCard'
import { companyCatalogApi } from '../services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '../services/dataLibraryApi'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function CompanyProductVariantDetailsPage() {
  const { t, i18n } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { productId = '', variantId = '' } = useParams()
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const canEdit = activeRole === 'company_admin'
  const canAddStock = activeRole === 'company_admin'
  const [variant, setVariant] = useState<LibraryProductVariant | null>(null)
  const [libraryProductId, setLibraryProductId] = useState<string | null>(null)
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
        setError(t('variantDetail.notLinked'))
        return
      }
      setLibraryProductId(product.libraryEntityId)
      const result = await dataLibraryApi.getProductVariant(product.libraryEntityId, variantId)
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
        canEdit && variant && !variant.isDefault ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
          >
            {tc('delete')}
          </Button>
        ) : undefined
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
            <EditableSectionCard
              title={t('variantDetail.variantCard.title')}
              description={t('variantDetail.variantCard.description')}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{variant.name}</h2>
                {variant.isDefault ? (
                  <StatusTag variant="verified" className="shrink-0">
                    {t('variantDetail.variantCard.default')}
                  </StatusTag>
                ) : null}
              </div>
              <ReadOnlyField label={t('variantDetail.variantCard.sku')} value={variant.sku} />
            </EditableSectionCard>

            <CompanyProductVariantStocksCard
              libraryProductId={libraryProductId}
              variantId={variantId}
              canEdit={canAddStock}
            />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
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
