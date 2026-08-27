import { useEffect, useState } from 'react'
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
import { CopyToAiButton } from '@/features/shell/components/CopyToAiButton'
import { productsActions } from '@/features/products/store'
import type { ProductWizardStep } from '@/features/products/schemas/productSchemas'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

const PRODUCT_DETAIL_TABS = [
  'overview',
  'gallery',
  'attributes',
  'variants',
] as const satisfies readonly CatalogDetailTabId[]

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function ProductDetailsPage() {
  const { t } = useTranslation('products')
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
    detailStatus === 'loading' && !detail ? t('loadingProduct') : null,
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
          title={t('singular')}
          description={t('sectionDescription')}
          status={product.status}
          canEdit={canEdit}
          onEdit={() => openWizard(1)}
        >
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <ReadOnlyField
            label={t('common:description')}
            value={product.description?.trim() ? product.description : t('noDescription')}
          />
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title={t('tags')}
          description={t('tagsDescription')}
          canEdit={canEdit}
          onEdit={() => openWizard(2)}
        >
          {product.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noTags')}</p>
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
            <CardTitle className="text-lg">{t('metadata')}</CardTitle>
            <CardDescription>{t('metadataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReadOnlyField label={t('created')} value={formatDisplayDateTime(product.createdAt)} />
            <ReadOnlyField label={t('updated')} value={formatDisplayDateTime(product.updatedAt)} />
            <ReadOnlyField
              label={t('references')}
              value={String(product.referenceCount ?? 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={product?.name ?? t('singular')}
      description={t('details')}
      onBack={() => goToList('products')}
      backLabel={t('common:back')}
      actions={
        product ? <CopyToAiButton kind="product" id={product.id} label={product.name} /> : undefined
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {product ? (
        <CatalogDetailSectionTabs
          ns="products"
          ariaLabel={t('sectionsAria')}
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
