import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Card,
  ConfirmDialog,
  EditableSectionCard,
  FeatureScreen,
  ImagePreview,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TagChip,
  tabsPageClassName,
  tabsPageContentClassName,
  useToast,
} from '@webonone/mobile-ui'
import type { SelectTagValue } from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { CatalogPricingDialog } from '@/features/data/company-catalog/components/CatalogPricingDialog'
import { CompanyCatalogAttributesTab } from '@/features/data/company-catalog/components/CompanyCatalogAttributesTab'
import { CompanyCatalogFormDialog } from '@/features/data/company-catalog/components/CompanyCatalogFormDialog'
import { CompanyCatalogGalleryTab } from '@/features/data/company-catalog/components/CompanyCatalogGalleryTab'
import { CompanyProductVariantsTab } from '@/features/data/company-catalog/components/CompanyProductVariantsTab'
import { CompanyServiceFormDialog } from '@/features/data/company-catalog/components/CompanyServiceFormDialog'
import { CompanyServiceWorkflowTab } from '@/features/data/company-catalog/components/CompanyServiceWorkflowTab'
import { CompanyCatalogDetailPageMenu } from '@/features/data/company-catalog/components/CompanyCatalogDetailPageMenu'
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import {
  isCompanyCatalogWriteTool,
  isDataAttributeValueWriteTool,
  isDataProductVariantWriteTool,
} from '@/features/ai/utils/catalogAiMutationRefresh'
import type { ServiceWizardStep } from '@/features/data/company-catalog/schemas/serviceSchemas'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import { catalogListPath, type CatalogKind } from '@/features/data/utils/dataPaths'
import { dataLibraryApi } from '@/features/sales/services/dataLibraryApi'
import { hydrateCatalogItems } from '@/features/sales/utils/hydrateCatalogItems'
import type { CatalogPayload, HydratedCatalogItem } from '@/features/sales/types/catalog.types'
import { isCatalogGalleryKind } from '@/features/sales/types/catalog.types'
import { CompanyCatalogReviewCard } from '@/features/reviews/components/CompanyCatalogReviewCard'
import { CompanyCatalogReviewsPanel } from '@/features/reviews/components/CompanyCatalogReviewsPanel'
import {
  catalogKindToReviewKind,
  isReviewableCatalogKind,
} from '@/features/reviews/utils/catalogReviewKind'

type DetailTab = 'overview' | 'gallery' | 'attributes' | 'variants' | 'workflow'

function tabsForKind(kind: CatalogKind): DetailTab[] {
  if (kind === 'products') return ['overview', 'gallery', 'attributes', 'variants']
  if (kind === 'services') return ['overview', 'gallery', 'attributes', 'workflow']
  return ['overview', 'gallery', 'attributes']
}

function formatListPrice(value: number | null | undefined): string {
  if (value == null) return '—'
  return `LKR ${value.toFixed(2)}`
}

export function CompanyCatalogDetailScreen({
  kind,
  itemId,
  membershipCompanyId,
}: {
  kind: CatalogKind
  itemId: string
  /** Settings → Connected companies catalog (membership-scoped API). */
  membershipCompanyId?: string
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { openReview } = useLocalSearchParams<{ openReview?: string }>()
  const openReviewFromLink = openReview === '1'
  const { toast } = useToast()
  const { user } = useSession()
  const sessionCompanyId = user?.companyId ?? ''
  const companyId = membershipCompanyId ?? sessionCompanyId
  const memberCatalogView = Boolean(membershipCompanyId)
  const { canManageCompanyCatalog, isCompanyCatalogReadOnly } = useDataCatalogScope()
  const readOnlyMember = memberCatalogView || isCompanyCatalogReadOnly
  const noun = t(`entities.${kind === 'products' ? 'product' : kind === 'services' ? 'service' : 'space'}`)

  const [item, setItem] = useState<HydratedCatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('overview')
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [serviceDialog, setServiceDialog] = useState<{ initialStep: ServiceWizardStep } | null>(null)
  const [resolvedTags, setResolvedTags] = useState<SelectTagValue[]>([])
  const busy = false

  const tabs = tabsForKind(kind)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = membershipCompanyId
        ? await companyCatalogApi.getForCompany(membershipCompanyId, kind, itemId)
        : await companyCatalogApi.get(kind, itemId)
      const [hydrated] = await hydrateCatalogItems(kind, [raw])
      setItem(hydrated ?? null)
    } catch (err) {
      setItem(null)
      setError(err instanceof Error ? err.message : t('detail.loading', { noun }))
    } finally {
      setLoading(false)
    }
  }, [itemId, kind, membershipCompanyId, noun, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (
        isCompanyCatalogWriteTool(toolName) ||
        isDataAttributeValueWriteTool(toolName) ||
        (kind === 'products' && isDataProductVariantWriteTool(toolName))
      ) {
        void load()
      }
    })
  }, [kind, load])

  useEffect(() => {
    setTab('overview')
  }, [kind, itemId])

  useEffect(() => {
    if (!item) {
      setResolvedTags([])
      return
    }
    const payload = item.payload ?? item.hydrated ?? null
    const tagIds = Array.isArray(payload?.tagIds)
      ? (payload.tagIds as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    let cancelled = false
    ;(async () => {
      if (tagIds.length === 0) {
        if (!cancelled) setResolvedTags([])
        return
      }
      try {
        const result = await dataLibraryApi.list('tags', { ids: tagIds, pageSize: tagIds.length })
        if (cancelled) return
        setResolvedTags(
          result.items.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: typeof tag.color === 'string' ? tag.color : '#2563EB',
          })),
        )
      } catch {
        if (!cancelled) {
          setResolvedTags(tagIds.map((id) => ({ id, name: id, color: '#2563EB' })))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [item])

  const canManage = canManageCompanyCatalog && !memberCatalogView
  const canEdit =
    canManage && (item?.bindingMode === 'forked' || item?.bindingMode === 'custom')
  const canCustomize =
    canManage &&
    item?.bindingMode === 'linked' &&
    Boolean(item.hydrated) &&
    !item.libraryUnavailable

  const entityPayload = useMemo(
    () => (item?.payload ?? item?.hydrated ?? null) as CatalogPayload | null,
    [item],
  )

  const servicePayload = kind === 'services' ? entityPayload : null
  const overviewGalleryImages = item?.displayGalleryImages ?? item?.galleryImages ?? []

  async function handleRemove() {
    setRemoving(true)
    try {
      await companyCatalogApi.remove(kind, itemId)
      toast({ title: tc('remove') })
      router.push(catalogListPath(kind))
    } catch (err) {
      toast({
        title: tc('remove'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setRemoving(false)
      setRemoveOpen(false)
    }
  }

  async function handleCustomize() {
    if (!item?.hydrated) return
    setCustomizing(true)
    try {
      await companyCatalogApi.fork(
        kind,
        itemId,
        item.hydrated,
        item.galleryImages == null ? (item.displayGalleryImages ?? []) : undefined,
      )
      toast({ title: t('detail.customize') })
      await load()
    } catch (err) {
      toast({
        title: t('detail.customize'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setCustomizing(false)
      setCustomizeOpen(false)
    }
  }

  function openAttributesEdit() {
    if (kind === 'services') {
      setServiceDialog({ initialStep: 4 })
      return
    }
    setEditOpen(true)
  }

  if (loading) {
    return (
      <FeatureScreen title={noun} onBack={() => router.back()}>
        <Spinner label={t('detail.loading', { noun })} />
      </FeatureScreen>
    )
  }

  if (!item) {
    return (
      <FeatureScreen title={noun} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? t('detail.notFoundTitle')}</Body>
      </FeatureScreen>
    )
  }

  const reviewEntityKind = isReviewableCatalogKind(kind) ? catalogKindToReviewKind(kind) : null
  const reviewCompanyId = companyId || item.companyId
  const reviewsPanel =
    reviewCompanyId && reviewEntityKind ? (
      <CompanyCatalogReviewsPanel
        companyId={reviewCompanyId}
        entityKind={reviewEntityKind}
        entityId={itemId}
      />
    ) : null
  const memberReviewCard =
    readOnlyMember && reviewCompanyId && reviewEntityKind ? (
      <CompanyCatalogReviewCard
        companyId={reviewCompanyId}
        entityKind={reviewEntityKind}
        entityId={itemId}
        displayName={item.displayName}
        imageUrl={overviewGalleryImages[0]?.url ?? null}
        autoOpenDialog={openReviewFromLink}
      />
    ) : null

  const overviewContent =
    kind === 'services' ? (
      <View className="gap-6">
        {overviewGalleryImages.length > 0 ? (
          <Card>
            <ImagePreview src={overviewGalleryImages[0]?.url ?? null} alt={item.displayName} />
          </Card>
        ) : null}
        <EditableSectionCard
          title={t('detail.serviceBasics.title')}
          description={t('detail.serviceBasics.description')}
          titleExtra={<StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>}
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 1 })}
        >
          <ReadOnlyField label={tc('name')} value={item.displayName} />
          <ReadOnlyField
            label={tc('description')}
            value={item.displayDescription?.trim() ? item.displayDescription : '—'}
          />
        </EditableSectionCard>
        {reviewsPanel}
        {memberReviewCard}
        <EditableSectionCard
          title={t('detail.pricing.title')}
          description={t('detail.pricing.description')}
          canEdit={canManage && !busy}
          onEdit={() => setPricingOpen(true)}
        >
          <ReadOnlyField label={t('detail.pricing.listPrice')} value={formatListPrice(item.listPrice)} />
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
        </EditableSectionCard>
        <EditableSectionCard
          title={t('detail.tags.title')}
          description={t('detail.tags.description')}
          canEdit={canEdit && !busy}
          onEdit={() => setServiceDialog({ initialStep: 3 })}
        >
          {resolvedTags.length === 0 ? (
            <Muted>{t('detail.tags.empty')}</Muted>
          ) : (
            <View className="flex-row flex-wrap gap-1">
              {resolvedTags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </View>
          )}
        </EditableSectionCard>
      </View>
    ) : (
      <View className="gap-6">
        {overviewGalleryImages.length > 0 ? (
          <Card>
            <ImagePreview src={overviewGalleryImages[0]?.url ?? null} alt={item.displayName} />
          </Card>
        ) : null}
        <EditableSectionCard
          title={noun}
          description={t('detail.entityBasics.description')}
          titleExtra={<StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>}
          canEdit={canEdit && !busy}
          onEdit={() => setEditOpen(true)}
        >
          <ReadOnlyField label={tc('name')} value={item.displayName} />
          <ReadOnlyField
            label={tc('description')}
            value={item.displayDescription?.trim() ? item.displayDescription : '—'}
          />
        </EditableSectionCard>
        {reviewsPanel}
        {memberReviewCard}
        <EditableSectionCard
          title={t('detail.pricing.title')}
          description={t('detail.pricing.description')}
          canEdit={canManage && !busy}
          onEdit={() => setPricingOpen(true)}
        >
          <ReadOnlyField label={t('detail.pricing.listPrice')} value={formatListPrice(item.listPrice)} />
        </EditableSectionCard>
        {(kind === 'products' || kind === 'spaces') && (
          <EditableSectionCard
            title={t('detail.tags.title')}
            description={t('detail.tags.descriptionEntity', { noun })}
            canEdit={canEdit && !busy}
            onEdit={() => setEditOpen(true)}
          >
            {resolvedTags.length === 0 ? (
              <Muted>{t('detail.tags.empty')}</Muted>
            ) : (
              <View className="flex-row flex-wrap gap-1">
                {resolvedTags.map((tag) => (
                  <TagChip key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </View>
            )}
          </EditableSectionCard>
        )}
      </View>
    )

  return (
    <>
      <FeatureScreen
        title={item.displayName}
        description={
          item.bindingMode === 'linked'
            ? t('detail.linkedHint')
            : item.libraryEntityId
              ? t('detail.forkedHint')
              : t('detail.customHint')
        }
        onBack={() => router.push(catalogListPath(kind))}
        backLabel={tc('back')}
        actions={
          isCatalogGalleryKind(kind) ? (
            <CompanyCatalogDetailPageMenu
              kind={kind}
              entityId={itemId}
              entityLabel={item.displayName}
              ariaLabel={t('detail.actionsFor', { name: item.displayName })}
              canCustomize={Boolean(canCustomize)}
              canRemove={canManage}
              busy={customizing || removing}
              onCustomize={() => setCustomizeOpen(true)}
              onRemove={() => setRemoveOpen(true)}
            />
          ) : null
        }
      >
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as DetailTab)}
          className={tabsPageClassName}
        >
          <TabsList aria-label={t('detail.ariaSections', { noun })}>
            {tabs.map((id) => (
              <TabsTrigger key={id} value={id}>
                {t(`detail.tabs.${id}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className={tabsPageContentClassName}>
            {overviewContent}
          </TabsContent>

          {isCatalogGalleryKind(kind) ? (
            <TabsContent value="gallery" className={tabsPageContentClassName}>
              <CompanyCatalogGalleryTab
                companyId={companyId}
                kind={kind}
                entityId={itemId}
                galleryImages={item.displayGalleryImages ?? []}
                canEdit={canManage && !isCompanyCatalogReadOnly}
                inheritsLibraryGallery={item.bindingMode === 'linked' && item.galleryImages == null}
                onSaved={() => void load()}
              />
            </TabsContent>
          ) : null}

          <TabsContent value="attributes" className={tabsPageContentClassName}>
            <CompanyCatalogAttributesTab
              kind={kind}
              entityId={itemId}
              entityName={item.displayName}
              libraryEntityId={item.libraryEntityId}
              payload={entityPayload}
              canEdit={canEdit && !busy}
              onEdit={openAttributesEdit}
            />
          </TabsContent>

          {kind === 'products' ? (
            <TabsContent value="variants" className={tabsPageContentClassName}>
              <CompanyProductVariantsTab
                productId={itemId}
                productName={item.displayName}
                libraryEntityId={item.libraryEntityId}
                canEdit={canEdit && !busy}
              />
            </TabsContent>
          ) : null}

          {kind === 'services' ? (
            <TabsContent value="workflow" className={tabsPageContentClassName}>
              <CompanyServiceWorkflowTab
                serviceId={itemId}
                timeMode={servicePayload?.timeMode === 'window' ? 'window' : 'duration'}
                canEdit={canManage && !busy}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </FeatureScreen>

      {kind === 'services' ? (
        <CompanyServiceFormDialog
          open={serviceDialog != null}
          id={itemId}
          initialStep={serviceDialog?.initialStep ?? 1}
          onOpenChange={(next) => !next && setServiceDialog(null)}
          onSaved={() => void load()}
        />
      ) : (
        <CompanyCatalogFormDialog
          open={editOpen}
          kind={kind}
          mode="edit"
          entityId={itemId}
          initialPayload={{
            ...(item.payload ?? item.hydrated ?? {}),
            listPrice: item.listPrice ?? null,
          }}
          onOpenChange={setEditOpen}
          onSaved={() => void load()}
        />
      )}

      <CatalogPricingDialog
        open={pricingOpen}
        kind={kind}
        id={itemId}
        listPrice={item.listPrice}
        onOpenChange={setPricingOpen}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={t('detail.removeTitleNamed', { name: item.displayName })}
        description={t('detail.removeDescription')}
        confirmLabel={tc('remove')}
        destructive
        busy={removing}
        onConfirm={() => void handleRemove()}
      />

      <ConfirmDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        title={t('detail.customize')}
        description={t('detail.linkedHint')}
        confirmLabel={t('detail.customize')}
        busy={customizing}
        onConfirm={() => void handleCustomize()}
      />
    </>
  )
}
