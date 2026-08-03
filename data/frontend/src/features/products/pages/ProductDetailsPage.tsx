import { useEffect, useState } from 'react'
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
  ImageCarousel,
  TagChip,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { CatalogAttributesTab } from '@/features/catalog/components/CatalogAttributesTab'
import {
  CatalogDetailSectionTabs,
  type CatalogDetailTabId,
} from '@/features/catalog/components/CatalogDetailSectionTabs'
import { CatalogLibraryGalleryCard } from '@/features/catalog/components/CatalogLibraryGalleryCard'
import { ProductFormDialog } from '@/features/products/components/ProductFormDialog'
import { ProductVariantsTab } from '@/features/products/components/ProductVariantsTab'
import { productsActions } from '@/features/products/store'
import type { ProductWizardStep } from '@/features/products/schemas/productSchemas'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

const PRODUCT_DETAIL_TABS = [
  'overview',
  'gallery',
  'attributes',
  'variants',
] as const satisfies readonly CatalogDetailTabId[]

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

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>()
  const { goToList } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.products)
  const canEdit =
    user?.role === 'super_admin' || user?.role === 'company_admin'
  const [dialog, setDialog] = useState<{ initialStep: ProductWizardStep } | null>(null)
  const [tab, setTab] = useDetailTabParam(PRODUCT_DETAIL_TABS, 'overview')

  useEffect(() => {
    if (!productId) return
    dispatch(productsActions.fetchDetailRequested({ id: productId }))
  }, [dispatch, productId])

  usePlatformLoading(
    detailStatus === 'loading' && !detail ? 'Loading product…' : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!productId) return <Navigate to="/products" replace />

  const id = productId
  const product = detail?.id === id ? detail : null

  function openWizard(initialStep: ProductWizardStep) {
    setDialog({ initialStep })
  }

  function refreshDetail() {
    dispatch(productsActions.fetchDetailRequested({ id, force: true }))
  }

  const overview = product ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {(product.galleryImages ?? []).length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <ImageCarousel images={product.galleryImages ?? []} alt={product.name} />
            </CardContent>
          </Card>
        ) : null}
        <EditableSectionCard
          title="Product"
          description="Name, status, and description"
          canEdit={canEdit}
          onEdit={() => openWizard(1)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <StatusBadge status={product.status} />
          </div>
          <ReadOnlyField
            label="Description"
            value={product.description?.trim() ? product.description : '—'}
          />
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title="Tags"
          description="Labels linked to this product"
          canEdit={canEdit}
          onEdit={() => openWizard(2)}
        >
          {product.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </EditableSectionCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meta</CardTitle>
            <CardDescription>Record timestamps and references</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReadOnlyField label="Created" value={formatTimestamp(product.createdAt)} />
            <ReadOnlyField label="Updated" value={formatTimestamp(product.updatedAt)} />
            <ReadOnlyField
              label="References"
              value={String(product.referenceCount ?? 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={product?.name ?? 'Product'}
      description="Product details"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => goToList('products')}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        </div>
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {product ? (
        <CatalogDetailSectionTabs
          ariaLabel="Product sections"
          tab={tab}
          onTabChange={setTab}
          overview={overview}
          attributes={
            <CatalogAttributesTab
              kind="products"
              entityId={id}
              attributes={product.attributes}
              canEdit={canEdit}
              onChanged={refreshDetail}
            />
          }
          gallery={
            <CatalogLibraryGalleryCard
              kind="products"
              entityId={id}
              galleryImages={product.galleryImages ?? []}
              accessToken={accessToken}
              canEdit={canEdit}
              onSaved={refreshDetail}
            />
          }
          variants={
            <ProductVariantsTab
              productId={id}
              productName={product.name}
              attributes={product.attributes}
              canEdit={canEdit}
            />
          }
        />
      ) : null}

      {dialog ? (
        <ProductFormDialog
          open
          id={id}
          initialStep={dialog.initialStep}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            refreshDetail()
            setDialog(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
