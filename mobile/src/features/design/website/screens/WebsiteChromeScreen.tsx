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
import { WebsiteChromeDialog } from '@/features/design/website/components/WebsiteChromeDialog'
import { WebsiteHubListPage } from '@/features/design/website/components/WebsiteHubListPage'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { websiteDesignerPath } from '@/features/design/utils/designPaths'
import type { WebsiteChrome } from '@/features/design/website/types'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

export function WebsiteChromeScreen({ kind }: { kind: 'headers' | 'footers' }) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsiteChrome | null>(null)

  const list = useServerPaginatedList<WebsiteChrome>({
    fetchPage: async (query) => {
      if (!hasCompany) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return websiteAdminApi.listChrome(kind, {
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
      })
    },
  })
  const onScroll = useListPageScroll(list)
  const description = kind === 'headers' ? t('headersDescription') : t('footersDescription')
  const searchPlaceholder = kind === 'headers' ? t('searchHeaders') : t('searchFooters')
  const addLabel = kind === 'headers' ? t('addHeader') : t('addFooter')
  const empty = kind === 'headers' ? t('emptyHeaders') : t('emptyFooters')

  async function handleCreate(name: string, isDefault: boolean) {
    setSaving(true)
    setDialogError(null)
    try {
      const created = await websiteAdminApi.createChrome(kind, { name, isDefault })
      toast({ title: t('created') })
      setDialogOpen(false)
      router.push(websiteDesignerPath(kind, created.id) as Href)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(item: WebsiteChrome) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.setDefaultChrome(kind, item.id)
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

  async function handleDelete(item: WebsiteChrome) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.deleteChrome(kind, item.id)
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

  if (!hasCompany) return <WebsiteNeedCompany section={kind} description={description} />

  return (
    <FeatureScreen
      title={t('title')}
      description={description}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={searchPlaceholder}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={searchPlaceholder}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialogOpen(true)}>
              {addLabel}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <WebsiteHubListPage
        section={kind}
        loading={list.loading}
        error={list.error}
        loadedCount={list.items.length}
        totalCount={list.total}
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
      >
        {list.items.length === 0 ? (
            <ItemListEmpty>{empty}</ItemListEmpty>
          ) : (
            <ItemList>
              {list.items.map((item) => (
                <ItemListItem key={item.id}>
                  <Pressable
                    className="min-w-0 flex-1"
                    onPress={() => router.push(websiteDesignerPath(kind, item.id) as Href)}
                  >
                    <ItemListContent title={item.name} />
                  </Pressable>
                  {item.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <ItemListMenuItem onPress={() => router.push(websiteDesignerPath(kind, item.id) as Href)}>
                        {t('openDesigner')}
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
        <WebsiteChromeDialog
          kind={kind}
          open={dialogOpen}
          isSaving={saving}
          error={dialogError}
          onOpenChange={setDialogOpen}
          onSubmit={(name, isDefault) => void handleCreate(name, isDefault)}
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

export function WebsiteHeadersScreen() {
  return <WebsiteChromeScreen kind="headers" />
}

export function WebsiteFootersScreen() {
  return <WebsiteChromeScreen kind="footers" />
}
