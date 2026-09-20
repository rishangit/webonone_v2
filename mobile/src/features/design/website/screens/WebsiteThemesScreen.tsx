import { useState } from 'react'
import { Pressable } from 'react-native'
import { useRouter, type Href } from 'expo-router'
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
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { WebsiteThemeDialog } from '@/features/design/website/components/WebsiteThemeDialog'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { websiteThemeEditPath } from '@/features/design/utils/designPaths'
import type { WebsiteThemeCreateValues } from '@/features/design/website/utils/websitePalette'
import type { WebsiteTheme } from '@/features/design/website/types'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

export function WebsiteThemesScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsiteTheme | null>(null)

  const list = useServerPaginatedList<WebsiteTheme>({
    fetchPage: async (query) => {
      if (!hasCompany) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return websiteAdminApi.listThemes({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
      })
    },
  })
  const onScroll = useListPageScroll(list)

  async function handleCreate(values: WebsiteThemeCreateValues) {
    setSaving(true)
    setDialogError(null)
    try {
      const created = await websiteAdminApi.createTheme({
        name: values.name,
        colors: values.colors,
        pageBackground: values.pageBackground,
        bodyTextColor: values.bodyTextColor,
      })
      toast({ title: t('created') })
      setDialogOpen(false)
      router.push(websiteThemeEditPath(created.id) as Href)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(item: WebsiteTheme) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.setDefaultTheme(item.id)
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

  async function handleDelete(item: WebsiteTheme) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.deleteTheme(item.id)
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

  if (!hasCompany) return <WebsiteNeedCompany section="themes" description={t('themesDescription')} />

  return (
    <FeatureScreen
      title={t('title')}
      description={t('themesDescription')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('searchThemes')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('searchThemes')}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialogOpen(true)}>
              {t('addTheme')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <WebsiteHubListPage
        section="themes"
        loading={list.loading}
        error={list.error}
        loadedCount={list.items.length}
        totalCount={list.total}
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
      >
        {list.items.length === 0 ? (
            <ItemListEmpty>{t('emptyThemes')}</ItemListEmpty>
          ) : (
            <ItemList>
              {list.items.map((item) => (
                <ItemListItem key={item.id}>
                  <Pressable
                    className="min-w-0 flex-1"
                    onPress={() => router.push(websiteThemeEditPath(item.id) as Href)}
                  >
                    <ItemListContent title={item.name} />
                  </Pressable>
                  {item.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                  {!item.isActive ? <StatusTag variant="pending">{t('inactive')}</StatusTag> : null}
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <ItemListMenuItem onPress={() => router.push(websiteThemeEditPath(item.id) as Href)}>
                        {tc('edit')}
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
        <WebsiteThemeDialog
          open={dialogOpen}
          isSaving={saving}
          error={dialogError}
          onOpenChange={setDialogOpen}
          onSubmit={(values) => void handleCreate(values)}
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
