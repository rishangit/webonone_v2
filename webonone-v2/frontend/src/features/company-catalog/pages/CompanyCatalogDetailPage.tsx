import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EditableSectionCard,
  FeaturePage,
  ImageCarousel,
  StatusTag,
  TagChip,
  type SelectTagValue,
  ReadOnlyField,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { CatalogApplicablePrice } from '../components/CatalogApplicablePrice'
import { CatalogDetailSectionTabs, type CatalogDetailTabId } from '../components/CatalogDetailSectionTabs'
import {
  CatalogPricesDiscountsTab,
  CatalogProductDiscountsTab,
} from '../components/CatalogPricesDiscountsTab'
import { CatalogEntityGalleryCard } from '../components/CatalogEntityGalleryCard'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import { SpaceFormDialog } from '../components/SpaceFormDialog'
import { CatalogShareDialog } from '../components/CatalogShareDialog'
import { CatalogWebPublishDialog } from '../components/CatalogWebPublishDialog'
import { CompanyCatalogAttributesTab } from '../components/CompanyCatalogAttributesTab'
import { CompanyCatalogDetailPageMenu } from '../components/CompanyCatalogDetailPageMenu'
import { CompanyProductDetailVariantPricingCard } from '../components/CompanyProductDetailVariantPricingCard'
import { CompanyServiceDetailOfferCard } from '../components/CompanyServiceDetailOfferCard'
import { CompanyProductVariantsTab } from '../components/CompanyProductVariantsTab'
import { CompanyServiceWorkflowOverviewCard } from '../components/CompanyServiceWorkflowOverviewCard'
import { CompanyServiceWorkflowTab } from '../components/CompanyServiceWorkflowTab'
import { MemberServiceSessionsCard } from '../components/MemberServiceSessionsCard'
import type { ProductWizardStep } from '../schemas/productSchemas'
import type { ServiceWizardStep } from '../schemas/serviceSchemas'
import { useCatalogPricing } from '../hooks/useCatalogPricing'
import { dataLibraryApi } from '../services/dataLibraryApi'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  CATALOG_ENTITY_KINDS,
  CATALOG_ENTITY_SINGULAR_KEYS,
  isCatalogGalleryKind,
  type CatalogEntityKind,
  type CatalogPayload,
  resolveWebPublishStatus,
} from '../types/companyCatalog.types'
import { CatalogEditedLabel } from '@/features/company-catalog/components/CatalogEditedLabel'
import { CatalogReadOnlyField } from '@/features/company-catalog/components/CatalogReadOnlyField'
import { useCatalogLibraryBaseline } from '@/features/company-catalog/hooks/useCatalogLibraryBaseline'
import { catalogEditedFieldsFromPayload } from '@/features/company-catalog/utils/catalogLibraryEdits'
import { CompanyCatalogReviewCard } from '@/features/reviews/components/CompanyCatalogReviewCard'
import { CompanyCatalogReviewsPanel } from '@/features/reviews/components/CompanyCatalogReviewsPanel'
import {
  catalogKindToReviewKind,
  isReviewableCatalogKind,
} from '@/features/reviews/utils/catalogReviewKind'

const CATALOG_TABS_BASE = [
  'overview',
  'gallery',
  'attributes',
] as const satisfies readonly CatalogDetailTabId[]

const CATALOG_TABS_WITH_VARIANTS = [
  ...CATALOG_TABS_BASE,
  'discounts',
  'variants',
] as const satisfies readonly CatalogDetailTabId[]

const CATALOG_TABS_WITH_WORKFLOW = [
  ...CATALOG_TABS_BASE,
  'priceList',
  'workflow',
] as const satisfies readonly CatalogDetailTabId[]

const CATALOG_TABS_WITH_PRICES = [
  ...CATALOG_TABS_BASE,
  'priceList',
] as const satisfies readonly CatalogDetailTabId[]

function isCatalogEntityKind(value: string): value is CatalogEntityKind {
  return (CATALOG_ENTITY_KINDS as readonly string[]).includes(value)
}

export type CompanyCatalogDetailPageProps = {
  /**
   * When set, load via membership-scoped API (`/company/:id/catalog/…`)
   * instead of the active company session (`/company/me/catalog/…`).
   */
  companyId?: string
  /** Override back navigation target (default `/data/:kind`). */
  backTo?: string
  /** Force member/read-only: no Edit, Remove, or section Edit. */
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
  const [searchParams] = useSearchParams()
  const openReviewFromLink = searchParams.get('openReview') === '1'
  const { detail, detailStatus, mutateStatus } = useAppSelector((s) => s.companyCatalog)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const allowedTabs = useMemo(() => {
    if (kind === 'products') return CATALOG_TABS_WITH_VARIANTS
    if (kind === 'services') return CATALOG_TABS_WITH_WORKFLOW
    if (kind === 'spaces') return CATALOG_TABS_WITH_PRICES
    return CATALOG_TABS_BASE
  }, [kind])
  const [tab, setTab] = useDetailTabParam(allowedTabs, 'overview')
  const [serviceDialog, setServiceDialog] = useState<{ initialStep: ServiceWizardStep } | null>(
    null,
  )
  const [productDialog, setProductDialog] = useState<{ initialStep: ProductWizardStep } | null>(
    null,
  )
  const [spaceDialog, setSpaceDialog] = useState<{ initialStep: ProductWizardStep } | null>(null)
  const [webPublishOpen, setWebPublishOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const priceKind =
    kind === 'products' || kind === 'services' || kind === 'spaces' ? kind : null
  const pricing = useCatalogPricing(priceKind, id, companyId)
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

  const libraryBaseline = useCatalogLibraryBaseline(kind, detail)
  const companyPayload = useMemo(() => {
    if (!detail) return null
    return (detail.payload ?? detail.hydrated) as CatalogPayload | null
  }, [detail])
  const editedFields = useMemo(() => {
    if (!kind || !companyPayload) return new Set()
    return catalogEditedFieldsFromPayload(kind, companyPayload, libraryBaseline)
  }, [kind, companyPayload, libraryBaseline])

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
    canManage &&
    (detail?.bindingMode !== 'linked' ||
      (Boolean(detail?.hydrated) && !detail?.libraryUnavailable))
  const showGalleryTabs = isCatalogGalleryKind(kind)
  const listPath = backTo ?? `/data/${kind}`
  const servicePayload = detail?.payload ?? detail?.hydrated ?? null
  const entityPayload = detail?.payload ?? detail?.hydrated ?? null
  const overviewGalleryImages = detail?.displayGalleryImages ?? detail?.galleryImages ?? []
  const reviewEntityKind =
    kind && isReviewableCatalogKind(kind) ? catalogKindToReviewKind(kind) : null
  /** Membership routes pass `companyId` in the URL; company admin Data nav uses `detail.companyId`. */
  const reviewCompanyId = companyId ?? detail?.companyId ?? null
  const reviewsPanel =
    reviewCompanyId && detail && reviewEntityKind ? (
      <CompanyCatalogReviewsPanel
        companyId={reviewCompanyId}
        entityKind={reviewEntityKind}
        entityId={id}
      />
    ) : null
  const memberReviewCard =
    readOnly && reviewCompanyId && detail && reviewEntityKind ? (
      <CompanyCatalogReviewCard
        companyId={reviewCompanyId}
        entityKind={reviewEntityKind}
        entityId={id}
        displayName={detail.displayName}
        imageUrl={overviewGalleryImages[0]?.url ?? null}
        autoOpenDialog={openReviewFromLink}
      />
    ) : null

  const serviceProfile = detail && kind === 'services' ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title={t('detail.serviceBasics.title')}
          description={t('detail.serviceBasics.description')}
          titleExtra={
            <StatusTag variant="verified">{t(`binding.${detail.bindingMode}`)}</StatusTag>
          }
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 1 })}
        >
          {showGalleryTabs && overviewGalleryImages.length > 0 ? (
            <div className="overflow-hidden rounded-md">
              <ImageCarousel images={overviewGalleryImages} alt={detail.displayName} />
            </div>
          ) : null}
          <CatalogReadOnlyField
            label={tc('name')}
            value={detail.displayName}
            edited={editedFields.has('name')}
          />
          <CatalogReadOnlyField
            label={tc('description')}
            value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
            edited={editedFields.has('description')}
          />
          {detail.libraryEntityId ? (
            <p className="text-sm text-muted-foreground">{t('detail.linkedLibraryNote')}</p>
          ) : null}
          {detail.libraryUnavailable ? (
            <div className="text-destructive">{t('detail.libraryItemUnavailable')}</div>
          ) : null}
        </EditableSectionCard>
        {reviewsPanel}
        {memberReviewCard}
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        <CompanyServiceDetailOfferCard
          serviceId={id}
          companyId={companyId}
          servicePayload={servicePayload}
          prices={pricing.prices}
          discounts={pricing.discounts}
          pricingLoading={pricing.loading}
          canEdit={canEdit}
          busy={busy}
          overviewActive={tab === 'overview'}
          onEdit={() => setServiceDialog({ initialStep: 1 })}
        />

        <EditableSectionCard
          title={t('detail.webPublish.title')}
          description={t('detail.webPublish.description')}
          canEdit={canManage && !busy && !readOnly}
          onEdit={() => setWebPublishOpen(true)}
        >
          <ReadOnlyField
            label={t('detail.webPublish.statusLabel')}
            value={t(`detail.webPublish.${resolveWebPublishStatus(detail.webPublishStatus)}`)}
          />
        </EditableSectionCard>

        {readOnly && reviewCompanyId && servicePayload?.timeMode === 'window' ? (
          <MemberServiceSessionsCard companyId={reviewCompanyId} serviceId={id} />
        ) : null}

        <EditableSectionCard
          title={t('detail.tags.title')}
          description={t('detail.tags.description')}
          titleExtra={<CatalogEditedLabel show={editedFields.has('tags')} />}
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

        <CompanyServiceWorkflowOverviewCard
          serviceId={id}
          companyId={reviewCompanyId ?? companyId ?? ''}
        />

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
        <EditableSectionCard
          title={noun}
          description={t('detail.entityBasics.description')}
          titleExtra={
            <StatusTag variant="verified">{t(`binding.${detail.bindingMode}`)}</StatusTag>
          }
          canEdit={canEdit && !busy}
          onEdit={() => {
            if (kind === 'products') setProductDialog({ initialStep: 1 })
            else if (kind === 'spaces') setSpaceDialog({ initialStep: 1 })
          }}
        >
          {showGalleryTabs && overviewGalleryImages.length > 0 ? (
            <div className="overflow-hidden rounded-md">
              <ImageCarousel images={overviewGalleryImages} alt={detail.displayName} />
            </div>
          ) : null}
          <CatalogReadOnlyField
            label={tc('name')}
            value={detail.displayName}
            edited={editedFields.has('name')}
          />
          <CatalogReadOnlyField
            label={tc('description')}
            value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
            edited={editedFields.has('description')}
          />
          {detail.libraryEntityId ? (
            <p className="text-sm text-muted-foreground">{t('detail.linkedLibraryNote')}</p>
          ) : null}
          {detail.libraryUnavailable ? (
            <div className="text-destructive">{t('detail.libraryItemUnavailable')}</div>
          ) : null}
        </EditableSectionCard>
        {reviewsPanel}
        {memberReviewCard}
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        {kind === 'products' ? (
          <CompanyProductDetailVariantPricingCard
            companyProductId={id}
            libraryProductId={detail.libraryEntityId}
            libraryUnavailable={Boolean(detail.libraryUnavailable)}
          />
        ) : null}

        {kind === 'spaces' ? (
          <EditableSectionCard
            title={t('detail.pricing.title')}
            description={t('priceList.overviewDescription')}
            canEdit={canManage && !busy}
            onEdit={() => setTab('priceList')}
          >
            <CatalogApplicablePrice
              prices={pricing.prices}
              discounts={pricing.discounts}
              loading={pricing.loading}
            />
          </EditableSectionCard>
        ) : null}

        {kind === 'products' || kind === 'spaces' ? (
          <EditableSectionCard
            title={t('detail.webPublish.title')}
            description={t('detail.webPublish.description')}
            canEdit={canManage && !busy && !readOnly}
            onEdit={() => setWebPublishOpen(true)}
          >
            <ReadOnlyField
              label={t('detail.webPublish.statusLabel')}
              value={t(`detail.webPublish.${resolveWebPublishStatus(detail.webPublishStatus)}`)}
            />
          </EditableSectionCard>
        ) : null}

        {kind === 'products' || kind === 'spaces' ? (
          <EditableSectionCard
            title={t('detail.tags.title')}
            description={t('detail.tags.descriptionEntity', { noun })}
            canEdit={canEdit && !busy}
            onEdit={() => {
              if (kind === 'products') setProductDialog({ initialStep: 2 })
              else if (kind === 'spaces') setSpaceDialog({ initialStep: 2 })
            }}
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
            canEdit={Boolean(canEdit)}
            canRemove={canManage}
            canShare={
              !readOnly && resolveWebPublishStatus(detail.webPublishStatus) === 'published'
            }
            busy={busy}
            onEdit={() => {
              if (kind === 'services') setServiceDialog({ initialStep: 1 })
              else if (kind === 'products') setProductDialog({ initialStep: 1 })
              else if (kind === 'spaces') setSpaceDialog({ initialStep: 1 })
            }}
            onRemove={() => setPendingRemove(true)}
            onShare={() => setShareOpen(true)}
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
              canAdd={canManage && !busy}
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
                canAdd={canManage && !busy}
              />
            ) : undefined
          }
          workflow={
            kind === 'services' ? (
              <CompanyServiceWorkflowTab
                serviceId={id}
                companyId={reviewCompanyId ?? companyId ?? ''}
                timeMode={
                  servicePayload?.timeMode === 'window' ? 'window' : 'duration'
                }
                canEdit={canManage && !busy}
              />
            ) : undefined
          }
          discounts={
            kind === 'products' ? (
              <CatalogProductDiscountsTab
                productId={id}
                discounts={pricing.discounts}
                loading={pricing.loading}
                error={pricing.error}
                canEdit={canManage && !busy}
                onChanged={() => {
                  void pricing.reload()
                }}
              />
            ) : undefined
          }
          priceList={
            kind === 'services' || kind === 'spaces' ? (
              <CatalogPricesDiscountsTab
                kind={kind}
                entityId={id}
                prices={pricing.prices}
                discounts={pricing.discounts}
                loading={pricing.loading}
                error={pricing.error}
                canEdit={canManage && !busy}
                onChanged={() => {
                  void pricing.reload()
                }}
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
      {!readOnly && kind === 'products' ? (
        <ProductFormDialog
          open={productDialog != null}
          id={id}
          initialStep={productDialog?.initialStep ?? 1}
          onOpenChange={(next) => {
            if (!next) setProductDialog(null)
          }}
          onSaved={() => {
            setProductDialog(null)
            dispatch(
              companyCatalogActions.detailRequested({
                kind: 'products',
                id,
                ...(companyId ? { companyId } : {}),
              }),
            )
          }}
        />
      ) : null}
      {!readOnly && kind === 'spaces' ? (
        <SpaceFormDialog
          open={spaceDialog != null}
          id={id}
          initialStep={spaceDialog?.initialStep ?? 1}
          onOpenChange={(next) => {
            if (!next) setSpaceDialog(null)
          }}
          onSaved={() => {
            setSpaceDialog(null)
            dispatch(
              companyCatalogActions.detailRequested({
                kind: 'spaces',
                id,
                ...(companyId ? { companyId } : {}),
              }),
            )
          }}
        />
      ) : null}

      {!readOnly && kind && isCatalogGalleryKind(kind) && detail ? (
        <CatalogShareDialog
          open={shareOpen}
          kind={kind}
          id={id}
          itemName={detail.displayName}
          onOpenChange={setShareOpen}
        />
      ) : null}

      {!readOnly && canManage && kind && isCatalogGalleryKind(kind) && detail ? (
        <CatalogWebPublishDialog
          open={webPublishOpen}
          kind={kind}
          id={id}
          webPublishStatus={resolveWebPublishStatus(detail.webPublishStatus)}
          onOpenChange={setWebPublishOpen}
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
