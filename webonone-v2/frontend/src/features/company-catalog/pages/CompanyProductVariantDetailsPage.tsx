import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
import { CompanyProductVariantStocksCard } from '@/features/company-catalog/components/CompanyProductVariantStocksCard'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { EditableSectionCard } from '../components/EditableSectionCard'
import { companyCatalogApi } from '../services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '../services/dataLibraryApi'

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

export function CompanyProductVariantDetailsPage() {
  const { productId = '', variantId = '' } = useParams()
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const canAddStock = activeRole === 'company_admin'
  const [variant, setVariant] = useState<LibraryProductVariant | null>(null)
  const [libraryProductId, setLibraryProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!productId || !variantId) return
    setLoading(true)
    setError(null)
    try {
      const product = await companyCatalogApi.get('products', productId)
      if (!product.libraryEntityId) {
        setVariant(null)
        setLibraryProductId(null)
        setError('This product is not linked to the Data library, so variants are unavailable.')
        return
      }
      setLibraryProductId(product.libraryEntityId)
      const result = await dataLibraryApi.getProductVariant(product.libraryEntityId, variantId)
      setVariant(result)
    } catch (err) {
      setVariant(null)
      setLibraryProductId(null)
      setError(err instanceof Error ? err.message : 'Failed to load variant')
    } finally {
      setLoading(false)
    }
  }, [productId, variantId])

  useEffect(() => {
    void load()
  }, [load])

  usePlatformLoading(loading && !variant ? 'Loading variant…' : null)

  if (!productId || !variantId) {
    return <Navigate to="/data/products" replace />
  }

  return (
    <FeaturePage
      title={variant?.name ?? 'Variant'}
      description="Product variant details"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/data/products/${productId}?tab=variants`)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
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
            <EditableSectionCard title="Variant" description="Name, default flag, and SKU">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{variant.name}</h2>
                {variant.isDefault ? (
                  <StatusTag variant="verified" className="shrink-0">
                    Default
                  </StatusTag>
                ) : null}
              </div>
              <ReadOnlyField label="SKU" value={variant.sku} />
            </EditableSectionCard>

            <CompanyProductVariantStocksCard
              libraryProductId={libraryProductId}
              variantId={variantId}
              canEdit={canAddStock}
            />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <EditableSectionCard
              title="Attribute values"
              description="Values that define this SKU"
            >
              {variant.values.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attribute values.</p>
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
                <CardTitle className="text-lg">Meta</CardTitle>
                <CardDescription>Record timestamps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label="Created" value={formatTimestamp(variant.createdAt)} />
                <ReadOnlyField label="Updated" value={formatTimestamp(variant.updatedAt)} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </FeaturePage>
  )
}
