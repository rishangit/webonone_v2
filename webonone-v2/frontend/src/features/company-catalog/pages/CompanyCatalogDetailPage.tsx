import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
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
import { CatalogPricingDialog } from '../components/CatalogPricingDialog'
import { CompanyCatalogAttributesTab } from '../components/CompanyCatalogAttributesTab'
import { CompanyCatalogDetailPageMenu } from '../components/CompanyCatalogDetailPageMenu'
import { CompanyProductVariantsTab } from '../components/CompanyProductVariantsTab'
import { CompanyServiceWorkflowOverviewCard } from '../components/CompanyServiceWorkflowOverviewCard'
import { CompanyServiceWorkflowTab } from '../components/CompanyServiceWorkflowTab'
import { EditableSectionCard } from '../components/EditableSectionCard'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import { MemberServiceSessionsCard } from '../components/MemberServiceSessionsCard'
import type { ServiceWizardStep } from '../schemas/serviceSchemas'
import { dataLibraryApi } from '../services/dataLibraryApi'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  CATALOG_ENTITY_KINDS,
  CATALOG_ENTITY_SINGULAR_KEYS,
  isCatalogGalleryKind,
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

const CATALOG_TABS_WITH_WORKFLOW = [
  ...CATALOG_TABS_BASE,
  'workflow',
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

function formatListPrice(value: number | null | undefined): string {
  if (value == null) return '—'
  return `LKR ${value.toFixed(2)}`
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
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { kind: kindParam = '', id = '', companyId: companyIdParam } = useParams()
  const companyId = companyIdProp ?? companyIdParam
  const kind = isCatalogEntityKind(kindParam) ? kindParam : null
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { detail, detailStatus, mutateStatus, mutateError } = useAppSelector((s) => s.companyCatalog)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const allowedTabs = useMemo(() => {
    if (kind === 'products') return CATALOG_TABS_WITH_VARIANTS
    if (kind === 'services') return CATALOG_TABS_WITH_WORKFLOW
    return CATALOG_TABS_BASE
  }, [kind])
  const [tab, setTab] = useDetailTabParam(allowedTabs, 'overview')
  const [editOpen, setEditOpen] = useState(false)
  const [pendingEditClose, setPendingEditClose] = useState(false)
  const [serviceDialog, setServiceDialog] = useState<{ initialStep: ServiceWizardStep } | null>(
    null,
  )
  const [pricingOpen, setPricingOpen] = useState(false)
  const [resolvedTags, setResolvedTags] = useState<SelectTagValue[]>([])
  const [pendingRemove, setPendingRemove] = useState(false)

  const loading = detailStatus === 'loading'
  usePlatformLoading(
    loading && kind ? t('detail.loading', { noun: t(`entities.${CATALOG_ENTITY_SINGULAR_KEYS[kind]}`) }) : null,
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
      <FeaturePage
        title={t('detail.notFoundTitle')}
        description={t('detail.notFoundDescription')}
        onBack={() => navigate(-1)}
        backLabel={tc('back')}
      >
        {null}
      </FeaturePage>
    )
  }

  const noun = t(`entities.${CATALOG_ENTITY_SINGULAR_KEYS[kind]}`)
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
            <CardContent className="p-4 sm:p-6">
              <ImageCarousel images={overviewGalleryImages} alt={detail.displayName} />
            </CardContent>
          </Card>
        ) : null}
        <EditableSectionCard
          title={t('detail.serviceBasics.title')}
          description={t('detail.serviceBasics.description')}
          titleExtra={
            <StatusTag variant="verified">{t(`binding.${detail.bindingMode}`)}</StatusTag>
          }
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 1 })}
        >
          <ReadOnlyField label={tc('name')} value={detail.displayName} />
          <ReadOnlyField
            label={tc('description')}
            value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
          />
          {detail.libraryUnavailable ? (
            <div className="text-destructive">{t('detail.libraryItemUnavailable')}</div>
          ) : null}
        </EditableSectionCard>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title={t('detail.pricing.title')}
          description={t('detail.pricing.description')}
          canEdit={canManage && !busy}
          onEdit={() => setPricingOpen(true)}
        >
          <ReadOnlyField label={t('detail.pricing.listPrice')} value={formatListPrice(detail.listPrice)} />
        </EditableSectionCard>

        <EditableSectionCard
          title={t('detail.time.title')}
          description={t('detail.time.description')}
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 2 })}
        >
          <ReadOnlyField
            label={t('detail.time.timeMode')}
            value={
              servicePayload?.timeMode === 'window'
                ? t('serviceWizard.fields.specificTime')
                : servicePayload?.timeMode === 'duration'
                  ? t('serviceWizard.fields.duration')
                  : '—'
            }
          />
          {servicePayload?.timeMode === 'duration' ? (
            <ReadOnlyField
              label={t('detail.time.duration')}
              value={
                servicePayload.durationMinutes != null
                  ? t('detail.durationMinutes', { count: servicePayload.durationMinutes })
                  : '—'
              }
            />
          ) : null}
          {servicePayload?.timeMode === 'window' ? (
            <>
              <ReadOnlyField
                label={t('detail.time.startTime')}
                value={
                  typeof servicePayload.startTime === 'string' ? servicePayload.startTime : '—'
                }
              />
              <ReadOnlyField
                label={t('detail.time.endTime')}
                value={typeof servicePayload.endTime === 'string' ? servicePayload.endTime : '—'}
              />
            </>
          ) : null}
        </EditableSectionCard>

        {readOnly && companyId && servicePayload?.timeMode === 'window' ? (
          <MemberServiceSessionsCard companyId={companyId} serviceId={id} />
        ) : null}

        <EditableSectionCard
          title={t('detail.tags.title')}
          description={t('detail.tags.description')}
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 3 })}
        >
          {resolvedTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('detail.tags.empty')}</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {resolvedTags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </EditableSectionCard>

        <CompanyServiceWorkflowOverviewCard serviceId={id} companyId={companyId} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.provenance.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">{t('detail.provenance.mode')}</div>
              <div>{t(`binding.${detail.bindingMode}`)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('detail.provenance.libraryId')}</div>
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
            <CardContent className="p-4 sm:p-6">
              <ImageCarousel images={overviewGalleryImages} alt={detail.displayName} />
            </CardContent>
          </Card>
        ) : null}
        <EditableSectionCard
          title={noun}
          description={t('detail.entityBasics.description')}
          titleExtra={
            <StatusTag variant="verified">{t(`binding.${detail.bindingMode}`)}</StatusTag>
          }
          canEdit={canEdit && !busy}
          onEdit={() => setEditOpen(true)}
        >
          <ReadOnlyField label={tc('name')} value={detail.displayName} />
          <ReadOnlyField
            label={tc('description')}
            value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
          />
          {detail.libraryUnavailable ? (
            <div className="text-destructive">{t('detail.libraryItemUnavailable')}</div>
          ) : null}
        </EditableSectionCard>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        {kind === 'products' || kind === 'spaces' ? (
          <EditableSectionCard
            title={t('detail.pricing.title')}
            description={t('detail.pricing.description')}
            canEdit={canManage && !busy}
            onEdit={() => setPricingOpen(true)}
          >
            <ReadOnlyField label={t('detail.pricing.listPrice')} value={formatListPrice(detail.listPrice)} />
          </EditableSectionCard>
        ) : null}

        {kind === 'products' || kind === 'spaces' ? (
          <EditableSectionCard
            title={t('detail.tags.title')}
            description={t('detail.tags.descriptionEntity', { noun })}
            canEdit={canEdit && !busy}
            onEdit={() => setEditOpen(true)}
          >
            {resolvedTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('detail.tags.empty')}</p>
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
            <CardTitle className="text-lg">{t('detail.provenance.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">{t('detail.provenance.mode')}</div>
              <div>{t(`binding.${detail.bindingMode}`)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('detail.provenance.libraryId')}</div>
              <div className="break-all">{detail.libraryEntityId ?? '—'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={detail?.displayName ?? t(`entities.${kind}`)}
      description={
        readOnly
          ? t('detail.pageDescription', { noun })
          : detail?.bindingMode === 'linked'
            ? t('detail.linkedHint')
            : detail?.libraryEntityId
              ? t('detail.forkedHint')
              : t('detail.customHint')
      }
      onBack={() => navigate(listPath)}
      backLabel={tc('back')}
      actions={
        detail && showGalleryTabs ? (
          <CompanyCatalogDetailPageMenu
            kind={kind}
            entityId={id}
            entityLabel={detail.displayName}
            ariaLabel={t('detail.actionsFor', { name: detail.displayName })}
            canCustomize={Boolean(canCustomize)}
            canRemove={canManage}
            busy={busy}
            onCustomize={() => {
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
            onRemove={() => setPendingRemove(true)}
          />
        ) : undefined
      }
    >
      {detail && readOnly ? (
        kind === 'services' ? serviceProfile : genericProfile
      ) : null}

      {detail && !readOnly && showGalleryTabs ? (
        <CatalogDetailSectionTabs
          ariaLabel={t('detail.ariaSections', { noun })}
          tab={tab}
          onTabChange={setTab}
          overview={kind === 'services' ? serviceProfile : genericProfile}
          attributes={
            <CompanyCatalogAttributesTab
              kind={kind}
              entityId={id}
              entityName={
                detail.name ??
                (typeof entityPayload?.name === 'string' ? entityPayload.name : '')
              }
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
                productName={detail.displayName}
                libraryEntityId={detail.libraryEntityId}
                canEdit={canEdit && !busy}
              />
            ) : undefined
          }
          workflow={
            kind === 'services' ? (
              <CompanyServiceWorkflowTab
                serviceId={id}
                companyId={companyId}
                timeMode={
                  servicePayload?.timeMode === 'window' ? 'window' : 'duration'
                }
                canEdit={canManage && !busy}
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
          initialPayload={
            detail
              ? {
                  ...(detail.payload ?? {}),
                  listPrice: detail.listPrice ?? null,
                }
              : undefined
          }
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

      {!readOnly && kind && isCatalogGalleryKind(kind) && detail ? (
        <CatalogPricingDialog
          open={pricingOpen}
          kind={kind}
          id={id}
          listPrice={detail.listPrice}
          onOpenChange={setPricingOpen}
        />
      ) : null}

      {!readOnly ? (
        <PlatformAlertConfirmDialog
          open={pendingRemove}
          title={
            detail
              ? t('detail.removeTitleNamed', { name: detail.displayName })
              : t('detail.removeTitleNoun', { noun })
          }
          description={t('detail.removeDescription')}
          isAllowedParentOrigin={isAllowedParentOrigin}
          submitLabel={tc('remove')}
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
