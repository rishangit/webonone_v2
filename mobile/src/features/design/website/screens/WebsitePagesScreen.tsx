import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ConfirmDialog,
  FeatureScreen,
  FormField,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  ListAddButton,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageActions,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  StatusTag,
  useToast,
} from '@webonone/mobile-ui'
import { WebsiteHubListPage } from '@/features/design/website/components/WebsiteHubListPage'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { WebsitePageDialog } from '@/features/design/website/components/WebsitePageDialog'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { websiteDesignerPath } from '@/features/design/utils/designPaths'
import { websiteLivePageUrl } from '@/features/design/website/utils/websiteLiveUrl'
import type { PageMetaValues } from '@/features/design/website/schemas/websiteMeta'
import type { WebsiteLayout, WebsitePage } from '@/features/design/website/types'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

export function WebsitePagesScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialog, setDialog] = useState<{ initial?: PageMetaValues; id?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsitePage | null>(null)
  const [layouts, setLayouts] = useState<WebsiteLayout[]>([])
  const [liveUrl, setLiveUrl] = useState<Awaited<ReturnType<typeof websiteAdminApi.getLiveUrl>> | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const list = useServerPaginatedList<WebsitePage>({
    fetchPage: async (query) => {
      if (!hasCompany) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      const result = await websiteAdminApi.listPages({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
        status: typeof query.status === 'string' ? query.status : undefined,
      })
      return result
    },
  })
  const onScroll = useListPageScroll(list)
  const status = String(list.queryParams.status ?? 'all')

  useEffect(() => {
    if (!hasCompany) return
    void websiteAdminApi
      .listLayouts({ page: 1, pageSize: 48 })
      .then((result) => setLayouts(result.items))
      .catch(() => setLayouts([]))
    void websiteAdminApi.getLiveUrl().then(setLiveUrl).catch(() => setLiveUrl(null))
  }, [hasCompany])

  async function handleSubmit(values: PageMetaValues) {
    setSaving(true)
    setDialogError(null)
    try {
      if (dialog?.id) {
        await websiteAdminApi.updatePage(dialog.id, values)
        toast({ title: t('saved') })
        setDialog(null)
        list.reload()
        return
      }
      const created = await websiteAdminApi.createPage(values)
      toast({ title: t('created') })
      setDialog(null)
      router.push(websiteDesignerPath('pages', created.id) as Href)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(page: WebsitePage) {
    setBusyId(page.id)
    try {
      await websiteAdminApi.deletePage(page.id)
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

  if (!hasCompany) {
    return <WebsiteNeedCompany section="pages" description={t('pagesDescription')} />
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={t('pagesDescription')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('searchPages')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('searchPages')}
          />
          <ListFilterTrigger
            active={status !== 'all'}
            onPress={() => setFilterOpen(true)}
            accessibilityLabel={t('filterPages')}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialog({})}>
              {t('addPage')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <WebsiteHubListPage
        section="pages"
        loading={list.loading}
        error={list.error}
        loadedCount={list.items.length}
        totalCount={list.total}
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
        filterPanel={
          <ListFilterPanel
            open={filterOpen}
            onOpenChange={setFilterOpen}
            onApply={() => undefined}
            onClear={() => list.patchQueryParams({ status: 'all' })}
          >
            <FormField label={tc('status')}>
              <Select
                value={status}
                onValueChange={(value) => list.patchQueryParams({ status: value })}
              >
                <SelectTrigger />
                <SelectContent>
                  <SelectItem value="all">{tc('all')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </ListFilterPanel>
        }
      >
        {list.items.length === 0 ? (
          <ItemListEmpty>{t('emptyPages')}</ItemListEmpty>
        ) : (
          <ItemList>
            {list.items.map((page) => (
              <ItemListItem key={page.id}>
                <Pressable
                  className="min-w-0 flex-1"
                  onPress={() => router.push(websiteDesignerPath('pages', page.id) as Href)}
                >
                  <ItemListContent
                    title={page.name}
                    subtitle={`/${page.path} · ${page.layoutName ?? t('layout')}`}
                  />
                </Pressable>
                <StatusTag variant={page.status === 'active' ? 'approved' : 'pending'}>
                  {page.status === 'active' ? t('active') : t('inactive')}
                </StatusTag>
                {canManage ? (
                  <ItemListMenu ariaLabel={t('actionsFor', { name: page.name })}>
                    <ItemListMenuItem onPress={() => router.push(websiteDesignerPath('pages', page.id) as Href)}>
                      {t('openDesigner')}
                    </ItemListMenuItem>
                    <ItemListMenuItem
                      onPress={() => void Linking.openURL(websiteLivePageUrl(liveUrl, page.companyId, page.path))}
                    >
                      {t('browseLive')}
                    </ItemListMenuItem>
                    <ItemListMenuItem
                      onPress={() =>
                        setDialog({
                          id: page.id,
                          initial: {
                            name: page.name,
                            path: page.path,
                            status: page.status,
                            layoutId: page.layoutId,
                          },
                        })
                      }
                    >
                      {t('editDetails')}
                    </ItemListMenuItem>
                    <ItemListMenuSeparator />
                    <ItemListMenuItem destructive onPress={() => setPendingDelete(page)} disabled={busyId === page.id}>
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
        <WebsitePageDialog
          open={dialog !== null}
          isSaving={saving}
          error={dialogError}
          initial={dialog?.initial}
          layouts={layouts}
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
