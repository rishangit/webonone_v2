import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
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
      setError(err instanceof Error ? err.message : 'Failed to load variant')
    } finally {
      setLoading(false)
    }
  }, [productId, variantId])

  useEffect(() => {
    void load()
  }, [load])

  usePlatformLoading(loading && !variant ? 'Loading variant…' : null)

  if (!accessToken) return <Navigate to="/login" replace />
  if (!productId || !variantId) return <Navigate to="/products" replace />

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
            onClick={() => goToDetail('products', productId, { tab: 'variants' })}
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

      {variant ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title="Variant"
              description="Name, default flag, and SKU"
            >
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

            <ProductVariantStocksCard
              productId={productId}
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
                      value={formatAttributeValueLabel(value, value.unitSymbol)}
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
