import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  ImageCarousel,
  StatusTag,
  TagChip,
  type SelectTagValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { CatalogDetailSectionTabs, type CatalogDetailTabId } from '../components/CatalogDetailSectionTabs'
import { CatalogEntityGalleryCard } from '../components/CatalogEntityGalleryCard'
import { CatalogFormDialog } from '../components/CatalogFormDialog'
import { CompanyCatalogAttributesTab } from '../components/CompanyCatalogAttributesTab'
import { CompanyProductVariantsTab } from '../components/CompanyProductVariantsTab'
import { EditableSectionCard } from '../components/EditableSectionCard'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import { ServiceFormLinkDialog } from '../components/ServiceFormLinkDialog'
import { FillServiceFormDialog } from '../components/FillServiceFormDialog'
import type { ServiceWizardStep } from '../schemas/serviceSchemas'
import { designFormsApi } from '@/features/design/services/designFormsApi'
import { dataLibraryApi } from '../services/dataLibraryApi'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  bindingModeLabel,
  CATALOG_ENTITY_KINDS,
  CATALOG_ENTITY_LABELS,
  isCatalogGalleryKind,
  singularLabel,
  type CatalogEntityKind,
  type CatalogPayload,
} from '../types/companyCatalog.types'

const CATALOG_TABS_BASE = [
  'overview',
  'gallery',
  'attributes',
] as const satisfies readonly CatalogDetailTabId[]

const CATALOG_TABS_WITH_VARIANTS = [
  ...CATALOG_TABS_BASE,
  'variants',
] as const satisfies readonly CatalogDetailTabId[]

function isCatalogEntityKind(value: string): value is CatalogEntityKind {
  return (CATALOG_ENTITY_KINDS as readonly string[]).includes(value)
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export type CompanyCatalogDetailPageProps = {
  /**
   * When set, load via membership-scoped API (`/company/:id/catalog/…`)
   * instead of the active company session (`/company/me/catalog/…`).
   */
  companyId?: string
  /** Override back navigation target (default `/data/:kind`). */
  backTo?: string
  /** Force member/read-only: no Customize, Remove, or section Edit. */
  readOnly?: boolean
}

export function CompanyCatalogDetailPage({
  companyId: companyIdProp,
  backTo,
  readOnly = false,
}: CompanyCatalogDetailPageProps = {}) {
  const { kind: kindParam = '', id = '', companyId: companyIdParam } = useParams()
  const companyId = companyIdProp ?? companyIdParam
  const kind = isCatalogEntityKind(kindParam) ? kindParam : null
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { detail, detailStatus, mutateStatus, mutateError } = useAppSelector((s) => s.companyCatalog)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const allowedTabs = useMemo(
    () => (kind === 'products' ? CATALOG_TABS_WITH_VARIANTS : CATALOG_TABS_BASE),
    [kind],
  )
  const [tab, setTab] = useDetailTabParam(allowedTabs, 'overview')
  const [editOpen, setEditOpen] = useState(false)
  const [pendingEditClose, setPendingEditClose] = useState(false)
  const [serviceDialog, setServiceDialog] = useState<{ initialStep: ServiceWizardStep } | null>(
    null,
  )
  const [formLinkOpen, setFormLinkOpen] = useState(false)
  const [fillFormOpen, setFillFormOpen] = useState(false)
  const [resolvedTags, setResolvedTags] = useState<SelectTagValue[]>([])
  const [pendingRemove, setPendingRemove] = useState(false)
  const [linkedFormName, setLinkedFormName] = useState<string | null>(null)

  const loading = detailStatus === 'loading'
  usePlatformLoading(
    loading && kind ? `Loading ${singularLabel(kind).toLowerCase()}…` : null,
  )

  useEffect(() => {
    if (!kind || !id) return
    dispatch(
      companyCatalogActions.detailRequested({
        kind,
        id,
        ...(companyId ? { companyId } : {}),
      }),
    )
    return () => {
      dispatch(companyCatalogActions.clearDetail())
    }
  }, [companyId, dispatch, kind, id])

  useEffect(() => {
    if (!detail || kind !== 'services' || !detail.formTemplateId) {
      setLinkedFormName(null)
      return
    }
    let cancelled = false
    designFormsApi
      .listPublished()
      .then((result) => {
        if (cancelled) return
        const match = result.items.find((item) => item.id === detail.formTemplateId)
        setLinkedFormName(match?.name ?? detail.formTemplateId ?? null)
      })
      .catch(() => {
        if (!cancelled) setLinkedFormName(detail.formTemplateId ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [detail, kind])

  useEffect(() => {
    if (!pendingEditClose) return
    if (mutateStatus === 'idle' && !mutateError) {
      setEditOpen(false)
      setPendingEditClose(false)
    } else if (mutateStatus === 'error') {
      setPendingEditClose(false)
    }
  }, [mutateStatus, mutateError, pendingEditClose])

  useEffect(() => {
    if (!detail || (kind !== 'services' && kind !== 'products' && kind !== 'spaces')) {
      setResolvedTags([])
      return
    }

    const payload = detail.payload ?? detail.hydrated ?? null
    const tagIds = Array.isArray(payload?.tagIds)
      ? (payload.tagIds as unknown[]).filter((v): v is string => typeof v === 'string')
      : []

    let cancelled = false
    ;(async () => {
      let tags: SelectTagValue[] = []
      if (tagIds.length > 0) {
        try {
          const result = await dataLibraryApi.list('tags', { ids: tagIds, pageSize: tagIds.length })
          tags = result.items.map((item) => ({
            id: item.id,
            name: item.name,
            color: typeof item.color === 'string' ? item.color : '#2563EB',
          }))
        } catch {
          tags = tagIds.map((tagId) => ({ id: tagId, name: tagId, color: '#2563EB' }))
        }
      }

      if (cancelled) return
      setResolvedTags(tags)
    })()

    return () => {
      cancelled = true
    }
  }, [detail, kind])

  if (!kind) {
    return (
      <FeaturePage title="Not found" description="Unknown catalog type.">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      </FeaturePage>
    )
  }

  const busy = mutateStatus === 'saving'
  const canManage = !readOnly && activeRole === 'company_admin'
  const canEdit =
    canManage && (detail?.bindingMode === 'forked' || detail?.bindingMode === 'custom')
  const canCustomize =
    canManage && detail?.bindingMode === 'linked' && detail.hydrated && !detail.libraryUnavailable
  const showGalleryTabs = isCatalogGalleryKind(kind)
  const listPath = backTo ?? `/data/${kind}`
  const servicePayload = detail?.payload ?? detail?.hydrated ?? null
  const entityPayload = detail?.payload ?? detail?.hydrated ?? null
  const overviewGalleryImages = detail?.displayGalleryImages ?? detail?.galleryImages ?? []

  function openAttributesEdit() {
    if (kind === 'services') {
      setServiceDialog({ initialStep: 4 })
      return
    }
    setEditOpen(true)
  }

  const serviceProfile = detail && kind === 'services' ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {showGalleryTabs && overviewGalleryImages.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <ImageCarousel images={overviewGalleryImages} alt={detail.displayName} />
            </CardContent>
          </Card>
        ) : null}
        <EditableSectionCard
          title="Service"
          description="Name and description"
          titleExtra={
            <StatusTag variant="verified">{bindingModeLabel(detail.bindingMode)}</StatusTag>
          }
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 1 })}
        >
          <ReadOnlyField label="Name" value={detail.displayName} />
          <ReadOnlyField
            label="Description"
            value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
          />
          {detail.libraryUnavailable ? (
            <div className="text-destructive">Library item is unavailable right now.</div>
          ) : null}
        </EditableSectionCard>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title="Time"
          description="How this service is scheduled"
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 2 })}
        >
          <ReadOnlyField
            label="Time mode"
            value={
              servicePayload?.timeMode === 'window'
                ? 'Specific time'
                : servicePayload?.timeMode === 'duration'
                  ? 'Duration'
                  : '—'
            }
          />
          {servicePayload?.timeMode === 'duration' ? (
            <ReadOnlyField
              label="Duration"
              value={
                servicePayload.durationMinutes != null
                  ? `${String(servicePayload.durationMinutes)} minutes`
                  : '—'
              }
            />
          ) : null}
          {servicePayload?.timeMode === 'window' ? (
            <>
              <ReadOnlyField
                label="Start time"
                value={
                  typeof servicePayload.startTime === 'string' ? servicePayload.startTime : '—'
                }
              />
              <ReadOnlyField
                label="End time"
                value={typeof servicePayload.endTime === 'string' ? servicePayload.endTime : '—'}
              />
            </>
          ) : null}
        </EditableSectionCard>

        <EditableSectionCard
          title="Tags"
          description="Labels linked to this service"
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 3 })}
        >
          {resolvedTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {resolvedTags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </EditableSectionCard>

        <EditableSectionCard
          title="Form"
          description="Design form linked to this service"
          canEdit={canManage && !busy}
          onEdit={() => setFormLinkOpen(true)}
        >
          <ReadOnlyField label="Linked form" value={linkedFormName ?? 'None'} />
          {detail.formTemplateId && canManage ? (
            <Button
              type="button"
              size="sm"
              className="mt-2"
              onClick={() => setFillFormOpen(true)}
            >
              Fill for customer
            </Button>
          ) : null}
        </EditableSectionCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Provenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Mode</div>
              <div>{bindingModeLabel(detail.bindingMode)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Library id</div>
              <div className="break-all">{detail.libraryEntityId ?? '—'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  const genericProfile = detail && kind !== 'services' ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {showGalleryTabs && overviewGalleryImages.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <ImageCarousel images={overviewGalleryImages} alt={detail.displayName} />
            </CardContent>
          </Card>
        ) : null}
        <EditableSectionCard
          title={singularLabel(kind)}
          description="Name and description"
          titleExtra={
            <StatusTag variant="verified">{bindingModeLabel(detail.bindingMode)}</StatusTag>
          }
          canEdit={canEdit && !busy}
          onEdit={() => setEditOpen(true)}
        >
          <ReadOnlyField label="Name" value={detail.displayName} />
          <ReadOnlyField
            label="Description"
            value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
          />
          {detail.libraryUnavailable ? (
            <div className="text-destructive">Library item is unavailable right now.</div>
          ) : null}
        </EditableSectionCard>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        {kind === 'products' || kind === 'spaces' ? (
          <EditableSectionCard
            title="Tags"
            description={`Labels linked to this ${singularLabel(kind).toLowerCase()}`}
            canEdit={canEdit && !busy}
            onEdit={() => setEditOpen(true)}
          >
            {resolvedTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {resolvedTags.map((tag) => (
                  <TagChip key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            )}
          </EditableSectionCard>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Provenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Mode</div>
              <div>{bindingModeLabel(detail.bindingMode)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Library id</div>
              <div className="break-all">{detail.libraryEntityId ?? '—'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={detail?.displayName ?? CATALOG_ENTITY_LABELS[kind]}
      description={
        readOnly
          ? `Company ${singularLabel(kind).toLowerCase()} details.`
          : detail?.bindingMode === 'linked'
            ? 'Live link to the Data library. Customize to keep a company-owned copy.'
            : detail?.libraryEntityId
              ? 'Company copy based on a library item.'
              : 'Company-owned catalog item.'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(listPath)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          {canCustomize ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!detail?.hydrated) return
                dispatch(
                  companyCatalogActions.forkRequested({
                    kind,
                    id,
                    payload: detail.hydrated,
                    galleryImages:
                      detail.galleryImages == null
                        ? (detail.displayGalleryImages ?? [])
                        : undefined,
                  }),
                )
              }}
              disabled={busy}
            >
              Customize
            </Button>
          ) : null}
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => setPendingRemove(true)}
            >
              Remove
            </Button>
          ) : null}
        </div>
      }
    >
      {detail && readOnly ? (
        kind === 'services' ? serviceProfile : genericProfile
      ) : null}

      {detail && !readOnly && showGalleryTabs ? (
        <CatalogDetailSectionTabs
          ariaLabel={`${singularLabel(kind)} sections`}
          tab={tab}
          onTabChange={setTab}
          overview={kind === 'services' ? serviceProfile : genericProfile}
          attributes={
            <CompanyCatalogAttributesTab
              kind={kind}
              libraryEntityId={detail.libraryEntityId}
              payload={entityPayload}
              canEdit={canEdit && !busy}
              onEdit={openAttributesEdit}
            />
          }
          gallery={
            <CatalogEntityGalleryCard
              companyId={detail.companyId}
              kind={kind}
              entityId={id}
              galleryImages={detail.displayGalleryImages ?? detail.galleryImages ?? []}
              canEdit={canManage && !busy}
              saving={busy}
              inheritsLibraryGallery={
                detail.bindingMode === 'linked' && detail.galleryImages == null
              }
            />
          }
          variants={
            kind === 'products' ? (
              <CompanyProductVariantsTab
                productId={id}
                libraryEntityId={detail.libraryEntityId}
              />
            ) : undefined
          }
        />
      ) : null}

      {detail && !readOnly && !showGalleryTabs ? genericProfile : null}

      {!readOnly && kind === 'services' ? (
        <ServiceFormDialog
          open={serviceDialog != null}
          id={id}
          initialStep={serviceDialog?.initialStep ?? 1}
          onOpenChange={(next) => {
            if (!next) setServiceDialog(null)
          }}
          onSaved={() => {
            setServiceDialog(null)
            dispatch(
              companyCatalogActions.detailRequested({
                kind: 'services',
                id,
                ...(companyId ? { companyId } : {}),
              }),
            )
          }}
        />
      ) : null}
      {!readOnly && kind !== 'services' ? (
        <CatalogFormDialog
          open={editOpen}
          kind={kind}
          mode="edit"
          initialPayload={detail?.payload}
          onOpenChange={setEditOpen}
          busy={busy}
          error={mutateError}
          onSubmit={(payload: CatalogPayload) => {
            dispatch(companyCatalogActions.clearMutateError())
            setPendingEditClose(true)
            dispatch(companyCatalogActions.updateRequested({ kind, id, payload }))
          }}
        />
      ) : null}

      {!readOnly && kind === 'services' && detail ? (
        <>
          <ServiceFormLinkDialog
            open={formLinkOpen}
            serviceId={id}
            currentFormTemplateId={detail.formTemplateId ?? null}
            onOpenChange={setFormLinkOpen}
            onSaved={() => {
              dispatch(
                companyCatalogActions.detailRequested({
                  kind: 'services',
                  id,
                  ...(companyId ? { companyId } : {}),
                }),
              )
            }}
          />
          {detail.formTemplateId ? (
            <FillServiceFormDialog
              open={fillFormOpen}
              onOpenChange={setFillFormOpen}
              formTemplateId={detail.formTemplateId}
              serviceId={id}
              serviceName={detail.displayName}
            />
          ) : null}
        </>
      ) : null}

      {!readOnly ? (
        <PlatformAlertConfirmDialog
          open={pendingRemove}
          title={detail ? `Remove ${detail.displayName}?` : `Remove ${singularLabel(kind).toLowerCase()}?`}
          description="This action cannot be undone. The item will be removed from your company catalog."
          isAllowedParentOrigin={isAllowedParentOrigin}
          submitLabel="Remove"
          onOpenChange={(open) => {
            if (!open) setPendingRemove(false)
          }}
          onConfirm={() => {
            dispatch(companyCatalogActions.deleteRequested({ kind, id }))
            navigate(listPath)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
