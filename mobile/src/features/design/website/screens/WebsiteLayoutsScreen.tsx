import { useEffect, useState } from 'react'
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
import { WebsiteHubListPage } from '@/features/design/website/components/WebsiteHubListPage'
import { WebsiteLayoutDialog } from '@/features/design/website/components/WebsiteLayoutDialog'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import type { LayoutMetaValues } from '@/features/design/website/schemas/websiteMeta'
import type { WebsiteChrome, WebsiteLayout, WebsiteTheme } from '@/features/design/website/types'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

export function WebsiteLayoutsScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialog, setDialog] = useState<{ initial?: LayoutMetaValues; id?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsiteLayout | null>(null)
  const [headers, setHeaders] = useState<WebsiteChrome[]>([])
  const [footers, setFooters] = useState<WebsiteChrome[]>([])
  const [themes, setThemes] = useState<WebsiteTheme[]>([])

  const list = useServerPaginatedList<WebsiteLayout>({
    fetchPage: async (query) => {
      if (!hasCompany) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return websiteAdminApi.listLayouts({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
      })
    },
  })
  const onScroll = useListPageScroll(list)

  useEffect(() => {
    if (!hasCompany) return
    void websiteAdminApi
      .listChrome('headers', { page: 1, pageSize: 48 })
      .then((r) => setHeaders(r.items))
      .catch(() => setHeaders([]))
    void websiteAdminApi
      .listChrome('footers', { page: 1, pageSize: 48 })
      .then((r) => setFooters(r.items))
      .catch(() => setFooters([]))
    void websiteAdminApi
      .listThemes({ page: 1, pageSize: 48 })
      .then((r) => setThemes(r.items))
      .catch(() => setThemes([]))
  }, [hasCompany])

  async function handleSubmit(values: LayoutMetaValues) {
    setSaving(true)
    setDialogError(null)
    try {
      if (dialog?.id) {
        await websiteAdminApi.updateLayout(dialog.id, values)
        toast({ title: t('saved') })
      } else {
        await websiteAdminApi.createLayout(values)
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

  async function handleSetDefault(item: WebsiteLayout) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.setDefaultLayout(item.id)
      toast({ title: t('saved') })
      list.reload()
    } catch (err) {
      toast({
        title: t('saveFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item: WebsiteLayout) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.deleteLayout(item.id)
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

  if (!hasCompany) return <WebsiteNeedCompany section="layouts" description={t('layoutsDescription')} />

  return (
    <FeatureScreen
      title={t('title')}
      description={t('layoutsDescription')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('searchLayouts')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('searchLayouts')}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialog({})}>
              {t('addLayout')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <WebsiteHubListPage
        section="layouts"
        loading={list.loading}
        error={list.error}
        loadedCount={list.items.length}
        totalCount={list.total}
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
      >
        {list.items.length === 0 ? (
          <ItemListEmpty>{t('emptyLayouts')}</ItemListEmpty>
        ) : (
          <ItemList>
            {list.items.map((item) => (
              <ItemListItem
                key={item.id}
                onPress={
                  canManage
                    ? () =>
                        setDialog({
                          id: item.id,
                          initial: {
                            name: item.name,
                            headerId: item.headerId,
                            footerId: item.footerId,
                            themeId: item.themeId,
                            isDefault: item.isDefault,
                            pageIds: item.pages.map((page) => page.id),
                          },
                        })
                    : undefined
                }
              >
                <ItemListContent
                  title={item.name}
                  subtitle={`${t('layoutPagesCount', { count: item.pages.length })}${
                    item.themeId
                      ? ` · ${themes.find((theme) => theme.id === item.themeId)?.name ?? t('theme')}`
                      : ''
                  }`}
                />
                {item.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                {canManage ? (
                  <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                    <ItemListMenuItem
                      onPress={() =>
                        setDialog({
                          id: item.id,
                          initial: {
                            name: item.name,
                            headerId: item.headerId,
                            footerId: item.footerId,
                            themeId: item.themeId,
                            isDefault: item.isDefault,
                            pageIds: item.pages.map((page) => page.id),
                          },
                        })
                      }
                    >
                      {t('editDetails')}
                    </ItemListMenuItem>
                    {!item.isDefault ? (
                      <ItemListMenuItem disabled={busyId === item.id} onPress={() => void handleSetDefault(item)}>
                        {t('setDefault')}
                      </ItemListMenuItem>
                    ) : null}
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
        <WebsiteLayoutDialog
          open={dialog !== null}
          isSaving={saving}
          error={dialogError}
          initial={dialog?.initial}
          headers={headers}
          footers={footers}
          themes={themes}
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
