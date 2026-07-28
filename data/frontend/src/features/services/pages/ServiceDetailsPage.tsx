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
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { ServiceFormDialog } from '@/features/services/components/ServiceFormDialog'
import { servicesActions } from '@/features/services/store'
import type { ServiceWizardStep } from '@/features/services/schemas/serviceSchemas'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { CatalogItem } from '@/shared/types/data.types'

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

function ServiceTimeContent({ service }: { service: CatalogItem }) {
  const mode = service.timeMode
  return (
    <>
      <ReadOnlyField
        label="Time mode"
        value={mode === 'window' ? 'Specific time' : mode === 'duration' ? 'Duration' : '—'}
      />
      {mode === 'duration' ? (
        <ReadOnlyField
          label="Duration"
          value={
            service.durationMinutes != null ? `${service.durationMinutes} minutes` : '—'
          }
        />
      ) : null}
      {mode === 'window' ? (
        <>
          <ReadOnlyField label="Start time" value={service.startTime ?? '—'} />
          <ReadOnlyField label="End time" value={service.endTime ?? '—'} />
        </>
      ) : null}
    </>
  )
}

export function ServiceDetailsPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const { goToList } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.services)
  const canEdit =
    user?.role === 'super_admin' || user?.role === 'company_admin'
  const [dialog, setDialog] = useState<{ initialStep: ServiceWizardStep } | null>(null)
  const [tab, setTab] = useState<CatalogDetailTabId>('profile')

  useEffect(() => {
    if (!serviceId) return
    dispatch(servicesActions.fetchDetailRequested({ id: serviceId }))
  }, [dispatch, serviceId])

  usePlatformLoading(
    detailStatus === 'loading' && !detail ? 'Loading service…' : null,
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

  const profile = service ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title="Service"
          description="Name, status, and description"
          canEdit={canEdit}
          onEdit={() => openWizard(1)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{service.name}</h2>
            <StatusBadge status={service.status} />
          </div>
          <ReadOnlyField
            label="Description"
            value={service.description?.trim() ? service.description : '—'}
          />
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title="Time"
          description="How this service is scheduled"
          canEdit={canEdit}
          onEdit={() => openWizard(2)}
        >
          <ServiceTimeContent service={service} />
        </EditableSectionCard>

        <EditableSectionCard
          title="Tags"
          description="Labels linked to this service"
          canEdit={canEdit}
          onEdit={() => openWizard(3)}
        >
          {service.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags.</p>
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
            <CardTitle className="text-lg">Meta</CardTitle>
            <CardDescription>Record timestamps and references</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReadOnlyField label="Created" value={formatTimestamp(service.createdAt)} />
            <ReadOnlyField label="Updated" value={formatTimestamp(service.updatedAt)} />
            <ReadOnlyField
              label="References"
              value={String(service.referenceCount ?? 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={service?.name ?? 'Service'}
      description="Service details"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => goToList('services')}>
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

      {service ? (
        <CatalogDetailSectionTabs
          ariaLabel="Service sections"
          tab={tab}
          onTabChange={setTab}
          profile={profile}
          attributes={
            <CatalogAttributesTab
              kind="services"
              entityId={id}
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
    </FeaturePage>
  )
}
