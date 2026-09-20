import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ConfirmDialog,
  FeatureScreen,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  ListAddButton,
  ListPageActions,
  SearchInput,
  StatusTag,
  useToast,
} from '@webonone/mobile-ui'
import { WebsiteDatasetDialog } from '@/features/design/website/components/WebsiteDatasetDialog'
import { WebsiteHubListPage } from '@/features/design/website/components/WebsiteHubListPage'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import type { CreateWebsiteDatasetValues } from '@/features/design/website/schemas/websiteDatasetSchemas'
import type { WebsiteDataset } from '@/features/design/website/types'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

export function WebsiteDatasetsScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialog, setDialog] = useState<{ id?: string; initial?: WebsiteDataset | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsiteDataset | null>(null)

  const list = useServerPaginatedList<WebsiteDataset>({
    fetchPage: async (query) => {
      if (!hasCompany) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return websiteAdminApi.listDatasets({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
      })
    },
  })
  const onScroll = useListPageScroll(list)

  async function handleSubmit(values: CreateWebsiteDatasetValues) {
    setSaving(true)
    setDialogError(null)
    try {
      if (dialog?.id) {
        await websiteAdminApi.updateDataset(dialog.id, values)
        toast({ title: t('saved') })
      } else {
        await websiteAdminApi.createDataset(values)
        toast({ title: t('created') })
      }
      setDialog(null)
      list.reload()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: WebsiteDataset) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.deleteDataset(item.id)
      list.reload()
    } catch (err) {
      toast({
        title: t('deleteConfirmFallback'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
      setPendingDelete(null)
    }
  }

  if (!hasCompany) return <WebsiteNeedCompany section="datasets" description={t('datasetsDescription')} />

  return (
    <FeatureScreen
      title={t('title')}
      description={t('datasetsDescription')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('searchDatasets')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('searchDatasets')}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialog({})}>
              {t('addDataset')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <WebsiteHubListPage
        section="datasets"
        loading={list.loading}
        error={list.error}
        loadedCount={list.items.length}
        totalCount={list.total}
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
      >
        {list.items.length === 0 ? (
            <ItemListEmpty>{t('emptyDatasets')}</ItemListEmpty>
          ) : (
            <ItemList>
              {list.items.map((item) => (
                <ItemListItem
                  key={item.id}
                  onPress={canManage ? () => setDialog({ id: item.id, initial: item }) : undefined}
                >
                  <ItemListContent
                    title={item.name}
                    subtitle={`${t(`datasetSource.${item.sourceType}`)} · ${item.filters?.rules?.length ?? 0} ${t('datasetRules')}`}
                  />
                  <StatusTag variant={item.status === 'active' ? 'approved' : 'pending'}>
                    {item.status === 'active' ? t('active') : t('inactive')}
                  </StatusTag>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <ItemListMenuItem onPress={() => setDialog({ id: item.id, initial: item })}>
                        {t('editDetails')}
                      </ItemListMenuItem>
                      <ItemListMenuSeparator />
                      <ItemListMenuItem destructive disabled={busyId === item.id} onPress={() => setPendingDelete(item)}>
                        {tc('delete')}
                      </ItemListMenuItem>
                    </ItemListMenu>
                  ) : null}
                </ItemListItem>
              ))}
            </ItemList>
          )}
      </WebsiteHubListPage>
      {canManage ? (
        <WebsiteDatasetDialog
          open={dialog !== null}
          isSaving={saving}
          error={dialogError}
          entityId={dialog?.id}
          initial={dialog?.initial}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSubmit={(values) => void handleSubmit(values)}
        />
      ) : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={pendingDelete ? t('deleteConfirm', { name: pendingDelete.name }) : t('deleteConfirmFallback')}
        description={t('deleteDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={pendingDelete !== null && busyId === pendingDelete.id}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete)
        }}
      />
    </FeatureScreen>
  )
}
