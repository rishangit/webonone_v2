import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  EditableSectionCard,
  ImageCarousel,
  ReadOnlyField,
  TagChip,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CatalogAttributesTab } from '@/features/catalog/components/CatalogAttributesTab'
import {
  CatalogDetailSectionTabs,
  type CatalogDetailTabId,
} from '@/features/catalog/components/CatalogDetailSectionTabs'
import { CatalogLibraryGalleryCard } from '@/features/catalog/components/CatalogLibraryGalleryCard'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { CatalogLibraryDetailPageMenu } from '@/features/shell/components/CatalogLibraryDetailPageMenu'
import { ServiceDetailOfferCard } from '@/features/services/components/ServiceDetailOfferCard'
import { ServiceFormDialog } from '@/features/services/components/ServiceFormDialog'
import { servicesActions } from '@/features/services/store'
import type { ServiceWizardStep } from '@/features/services/schemas/serviceSchemas'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

const SERVICE_DETAIL_TABS: readonly CatalogDetailTabId[] = [
  'overview',
  'gallery',
  'attributes',
]

export function ServiceDetailsPage() {
  const { t } = useTranslation('services')
  const { serviceId } = useParams<{ serviceId: string }>()
  const { goToList } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.services)
  const canEdit =
    user?.role === 'super_admin' || user?.role === 'company_admin'
  const canDelete = user?.role === 'super_admin'
  const [dialog, setDialog] = useState<{ initialStep: ServiceWizardStep } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [tab, setTab] = useDetailTabParam(SERVICE_DETAIL_TABS, 'overview')

  useEffect(() => {
    if (!serviceId) return
    dispatch(servicesActions.fetchDetailRequested({ id: serviceId }))
  }, [dispatch, serviceId])

  usePlatformLoading(
    detailStatus === 'loading' && !detail ? t('loadingService') : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!serviceId) return <Navigate to="/services" replace />

  const id = serviceId
  const service = detail?.id === id ? detail : null

  function openWizard(initialStep: ServiceWizardStep) {
    setDialog({ initialStep })
  }

  function refreshDetail() {
    dispatch(servicesActions.fetchDetailRequested({ id, force: true }))
  }

  const overview = service ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title={t('singular')}
          description={t('sectionDescription')}
          headerTrailing={<StatusBadge status={service.status} />}
          canEdit={canEdit}
          onEdit={() => openWizard(1)}
        >
          {(service.galleryImages ?? []).length > 0 ? (
            <div className="overflow-hidden rounded-md">
              <ImageCarousel images={service.galleryImages ?? []} alt={service.name} />
            </div>
          ) : null}
          <h2 className="text-xl font-semibold">{service.name}</h2>
          <ReadOnlyField
            label={t('common:description')}
            value={service.description?.trim() ? service.description : t('noDescription')}
          />
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <ServiceDetailOfferCard
          service={service}
          canEdit={canEdit}
          onEdit={() => openWizard(1)}
        />

        <EditableSectionCard
          title={t('tags')}
          description={t('tagsDescription')}
          canEdit={canEdit}
          onEdit={() => openWizard(3)}
        >
          {service.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noTags')}</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {service.tags.map((tag) => (
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
            <ReadOnlyField label={t('created')} value={formatDisplayDateTime(service.createdAt)} />
            <ReadOnlyField label={t('updated')} value={formatDisplayDateTime(service.updatedAt)} />
            <ReadOnlyField
              label={t('references')}
              value={String(service.referenceCount ?? 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={service?.name ?? t('singular')}
      description={t('details')}
      onBack={() => goToList('services')}
      backLabel={t('common:back')}
      actions={
        service ? (
          <CatalogLibraryDetailPageMenu
            kind="service"
            entityId={service.id}
            entityLabel={service.name}
            ariaLabel={t('actionsFor', { name: service.name })}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => openWizard(1)}
            onDelete={() => setPendingDelete(true)}
          />
        ) : undefined
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {service ? (
        <CatalogDetailSectionTabs
          ns="services"
          ariaLabel={t('sectionsAria')}
          tab={tab}
          onTabChange={setTab}
          overview={overview}
          attributes={
            <CatalogAttributesTab
              kind="services"
              entityId={id}
              entityName={service.name}
              attributes={service.attributes}
              canEdit={canEdit}
              onChanged={refreshDetail}
            />
          }
          gallery={
            <CatalogLibraryGalleryCard
              kind="services"
              entityId={id}
              galleryImages={service.galleryImages ?? []}
              accessToken={accessToken}
              canEdit={canEdit}
              onSaved={refreshDetail}
            />
          }
        />
      ) : null}

      {dialog ? (
        <ServiceFormDialog
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

      <PlatformAlertConfirmDialog
        open={pendingDelete}
        title={
          service
            ? t('deleteConfirm', { name: service.name })
            : t('deleteConfirmFallback')
        }
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:remove')}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(false)
        }}
        onConfirm={() => {
          dispatch(servicesActions.deleteRequested({ id }))
          goToList('services')
        }}
      />
    </FeaturePage>
  )
}
