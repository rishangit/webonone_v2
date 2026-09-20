import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  ConfirmDialog,
  FeatureScreen,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  tabsPageContentClassName,
  useToast,
} from '@webonone/mobile-ui'
import { CatalogAttributesTab } from '@/features/data/components/CatalogAttributesTab'
import { CatalogGalleryTab } from '@/features/data/components/CatalogGalleryTab'
import {
  CatalogOverviewTab,
  type CatalogOverviewEditSection,
} from '@/features/data/components/CatalogOverviewTab'
import { ProductFormDialog } from '@/features/data/components/ProductFormDialog'
import { ProductVariantsTab } from '@/features/data/components/ProductVariantsTab'
import { ServiceFormDialog } from '@/features/data/components/ServiceFormDialog'
import { ServiceWorkflowTab } from '@/features/data/components/ServiceWorkflowTab'
import { SpaceFormDialog } from '@/features/data/components/SpaceFormDialog'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { catalogListPath, type CatalogKind } from '@/features/data/utils/dataPaths'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogItem } from '@/shared/types/data.types'

type CatalogDetailTab = 'overview' | 'gallery' | 'attributes' | 'variants' | 'workflow'

const CONFIG: Record<
  CatalogKind,
  {
    get: (id: string) => Promise<CatalogItem>
    remove: (id: string) => Promise<void>
  }
> = {
  products: {
    get: (id) => dataAdminApi.getProduct(id),
    remove: (id) => dataAdminApi.deleteProduct(id),
  },
  services: {
    get: (id) => dataAdminApi.getService(id),
    remove: (id) => dataAdminApi.deleteService(id),
  },
  spaces: {
    get: (id) => dataAdminApi.getSpace(id),
    remove: (id) => dataAdminApi.deleteSpace(id),
  },
}

function tabsForKind(kind: CatalogKind): CatalogDetailTab[] {
  if (kind === 'products') return ['overview', 'gallery', 'attributes', 'variants']
  if (kind === 'services') return ['overview', 'gallery', 'attributes', 'workflow']
  return ['overview', 'gallery', 'attributes']
}

function productWizardStep(section: CatalogOverviewEditSection): 1 | 2 | 3 | 4 {
  if (section === 'tags') return 2
  return 1
}

function serviceWizardStep(section: CatalogOverviewEditSection): 1 | 2 | 3 | 4 | 5 {
  if (section === 'time') return 2
  if (section === 'tags') return 3
  return 1
}

export function CatalogDetailScreen({ kind, itemId }: { kind: CatalogKind; itemId: string }) {
  const config = CONFIG[kind]
  const { t } = useTranslation(kind)
  const { t: tc } = useTranslation('common')
  const { t: tCatalog } = useTranslation('catalog')
  const router = useRouter()
  const { toast } = useToast()
  const { canEditCatalog, canDelete, canSetStatus } = useDataPermissions()
  const [item, setItem] = useState<CatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<CatalogDetailTab>('overview')
  const [productEdit, setProductEdit] = useState<{ initialStep: 1 | 2 | 3 | 4 } | null>(null)
  const [serviceEdit, setServiceEdit] = useState<{ initialStep: 1 | 2 | 3 | 4 | 5 } | null>(null)
  const [spaceEditOpen, setSpaceEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tabs = tabsForKind(kind)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItem(await config.get(itemId))
    } catch (err) {
      setItem(null)
      setError(err instanceof Error ? err.message : t('unableToLoad'))
    } finally {
      setLoading(false)
    }
  }, [config, itemId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTab('overview')
  }, [kind, itemId])

  function handleEditSection(section: CatalogOverviewEditSection) {
    if (kind === 'products') {
      setProductEdit({ initialStep: productWizardStep(section) })
      return
    }
    if (kind === 'services') {
      setServiceEdit({ initialStep: serviceWizardStep(section) })
      return
    }
    setSpaceEditOpen(true)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await config.remove(itemId)
      toast({ title: t('singular') })
      router.push(catalogListPath(kind))
    } catch (err) {
      toast({
        title: t('unableToLoad'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Spinner
          label={
            kind === 'products'
              ? t('loadingProduct')
              : kind === 'services'
                ? t('loadingService')
                : t('loadingSpace')
          }
        />
      </FeatureScreen>
    )
  }

  if (!item) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? t('unableToLoad')}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={item.name}
      description={t('details')}
      onBack={() => router.push(catalogListPath(kind))}
      backLabel={tc('back')}
      actions={
        canDelete ? (
          <Button size="sm" variant="outline" onPress={() => setDeleteOpen(true)}>
            {tc('delete')}
          </Button>
        ) : null
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as CatalogDetailTab)}
        className={tabsPageClassName}
      >
        <TabsList aria-label={t('sectionsAria')}>
          {tabs.map((id) => (
            <TabsTrigger key={id} value={id}>
              {id === 'workflow'
                ? tCatalog('detail.tabs.workflow')
                : t(id)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className={tabsPageContentClassName}>
          <CatalogOverviewTab
            kind={kind}
            item={item}
            canEdit={canEditCatalog}
            onEditSection={handleEditSection}
          />
        </TabsContent>
        <TabsContent value="gallery" className={tabsPageContentClassName}>
          <CatalogGalleryTab
            kind={kind}
            entityId={item.id}
            galleryImages={item.galleryImages ?? []}
            canEdit={canEditCatalog}
            onSaved={setItem}
          />
        </TabsContent>
        <TabsContent value="attributes" className={tabsPageContentClassName}>
          <CatalogAttributesTab
            kind={kind}
            entityId={item.id}
            attributes={item.attributes}
            canEdit={canEditCatalog}
            onSaved={setItem}
          />
        </TabsContent>
        {kind === 'products' ? (
          <TabsContent value="variants" className={tabsPageContentClassName}>
            <ProductVariantsTab
              productId={item.id}
              productName={item.name}
              attributes={item.attributes}
              canEdit={canEditCatalog}
            />
          </TabsContent>
        ) : null}
        {kind === 'services' ? (
          <TabsContent value="workflow" className={tabsPageContentClassName}>
            <ServiceWorkflowTab libraryServiceId={item.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      {canEditCatalog && kind === 'products' && productEdit ? (
        <ProductFormDialog
          open
          product={item}
          canSetStatus={canSetStatus}
          initialStep={productEdit.initialStep}
          onOpenChange={(open) => {
            if (!open) setProductEdit(null)
          }}
          onSaved={(saved) => {
            setItem(saved)
            setProductEdit(null)
          }}
        />
      ) : null}
      {canEditCatalog && kind === 'services' && serviceEdit ? (
        <ServiceFormDialog
          open
          service={item}
          canSetStatus={canSetStatus}
          initialStep={serviceEdit.initialStep}
          onOpenChange={(open) => {
            if (!open) setServiceEdit(null)
          }}
          onSaved={(saved) => {
            setItem(saved)
            setServiceEdit(null)
          }}
        />
      ) : null}
      {canEditCatalog && kind === 'spaces' ? (
        <SpaceFormDialog
          open={spaceEditOpen}
          space={item}
          canSetStatus={canSetStatus}
          onOpenChange={setSpaceEditOpen}
          onSaved={(saved) => {
            setItem(saved)
            setSpaceEditOpen(false)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('deleteConfirm', { name: item.name })}
        description={t('deleteDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={deleting}
        onConfirm={() => void handleDelete()}
      />
    </FeatureScreen>
  )
}
