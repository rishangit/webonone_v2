import { useMemo, useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { CatalogList } from '@/features/data/components/CatalogList'
import { ProductFormDialog } from '@/features/data/components/ProductFormDialog'
import { ServiceFormDialog } from '@/features/data/components/ServiceFormDialog'
import { SpaceFormDialog } from '@/features/data/components/SpaceFormDialog'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { usePaginatedEntityList } from '@/features/data/hooks/usePaginatedEntityList'
import { catalogDetailPath, type CatalogKind } from '@/features/data/utils/dataPaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogItem } from '@/shared/types/data.types'

const CONFIG: Record<
  CatalogKind,
  {
    list: (query: Parameters<typeof dataAdminApi.listProducts>[0]) => ReturnType<typeof dataAdminApi.listProducts>
    remove: (id: string) => Promise<void>
    verify: (id: string) => Promise<CatalogItem>
  }
> = {
  products: {
    list: (query) => dataAdminApi.listProducts(query),
    remove: (id) => dataAdminApi.deleteProduct(id),
    verify: (id) => dataAdminApi.updateProduct(id, { status: 'verified' }),
  },
  services: {
    list: (query) => dataAdminApi.listServices(query),
    remove: (id) => dataAdminApi.deleteService(id),
    verify: (id) => dataAdminApi.updateService(id, { status: 'verified' }),
  },
  spaces: {
    list: (query) => dataAdminApi.listSpaces(query),
    remove: (id) => dataAdminApi.deleteSpace(id),
    verify: (id) => dataAdminApi.updateSpace(id, { status: 'verified' }),
  },
}

export function CatalogListScreen({ kind }: { kind: CatalogKind }) {
  const { t } = useTranslation(kind)
  const config = CONFIG[kind]
  const router = useRouter()
  const { toast } = useToast()
  const { canCreateCatalog, canEditCatalog, canDelete, canSetStatus } = useDataPermissions()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)

  const fetchPage = useMemo(() => config.list, [config.list])
  const list = usePaginatedEntityList(fetchPage)
  const onScroll = useListPageScroll(list)

  async function handleVerify(item: CatalogItem) {
    setBusyId(item.id)
    try {
      await config.verify(item.id)
      toast({ title: t('verified') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to verify item',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item: CatalogItem) {
    setBusyId(item.id)
    try {
      await config.remove(item.id)
      toast({ title: t('singular') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to delete item',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  function renderFormDialog() {
    if (!canCreateCatalog) return null
    const common = {
      open: dialogOpen,
      canSetStatus,
      onOpenChange: (open: boolean) => {
        setDialogOpen(open)
        if (!open) setEditingItem(null)
      },
      onSaved: (saved: CatalogItem) => {
        list.reload()
        if (!editingItem) {
          router.push(catalogDetailPath(kind, saved.id) as Href)
        }
      },
    }

    if (kind === 'products') {
      return (
        <ProductFormDialog {...common} product={editingItem} />
      )
    }
    if (kind === 'services') {
      return (
        <ServiceFormDialog {...common} service={editingItem} />
      )
    }
    return <SpaceFormDialog {...common} space={editingItem} />
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={t('description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('search')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('search')}
          />
          {canCreateCatalog ? (
            <ListAddButton
              onPress={() => {
                setEditingItem(null)
                setDialogOpen(true)
              }}
            >
              {t('add')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {list.loading ? <Spinner label={t('loading')} /> : null}
      {list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <CatalogList
            items={list.items}
            busyId={busyId}
            canEdit={canEditCatalog}
            canDelete={canDelete}
            onOpen={(item) => router.push(catalogDetailPath(kind, item.id) as Href)}
            onEdit={(item) => {
              setEditingItem(item)
              setDialogOpen(true)
            }}
            onVerify={(item) => void handleVerify(item)}
            onDelete={(item) => void handleDelete(item)}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {renderFormDialog()}
    </FeatureScreen>
  )
}
