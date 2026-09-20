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
  useToast,
} from '@webonone/mobile-ui'
import { WebsiteHubListPage } from '@/features/design/website/components/WebsiteHubListPage'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { WebsitePresetDialog } from '@/features/design/website/components/WebsitePresetDialog'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { websiteDesignerPath } from '@/features/design/utils/designPaths'
import type { WebsitePreset } from '@/features/design/website/types'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

export function WebsitePresetsScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialog, setDialog] = useState<{ id?: string; initialName?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsitePreset | null>(null)

  const list = useServerPaginatedList<WebsitePreset>({
    fetchPage: async (query) => {
      if (!hasCompany) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return websiteAdminApi.listPresets({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
      })
    },
  })
  const onScroll = useListPageScroll(list)

  async function handleSubmit(name: string) {
    setSaving(true)
    setDialogError(null)
    try {
      if (dialog?.id) {
        await websiteAdminApi.updatePreset(dialog.id, { name })
        toast({ title: t('saved') })
        setDialog(null)
        list.reload()
        return
      }
      const created = await websiteAdminApi.createPreset({ name })
      toast({ title: t('created') })
      setDialog(null)
      router.push(websiteDesignerPath('presets', created.id) as Href)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: WebsitePreset) {
    setBusyId(item.id)
    try {
      await websiteAdminApi.deletePreset(item.id)
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

  if (!hasCompany) return <WebsiteNeedCompany section="presets" description={t('presetsDescription')} />

  return (
    <FeatureScreen
      title={t('title')}
      description={t('presetsDescription')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('searchPresets')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('searchPresets')}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialog({})}>
              {t('addPreset')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <WebsiteHubListPage
        section="presets"
        loading={list.loading}
        error={list.error}
        loadedCount={list.items.length}
        totalCount={list.total}
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
      >
        {list.items.length === 0 ? (
            <ItemListEmpty>{t('emptyPresets')}</ItemListEmpty>
          ) : (
            <ItemList>
              {list.items.map((item) => (
                <ItemListItem key={item.id}>
                  <Pressable
                    className="min-w-0 flex-1"
                    onPress={() => router.push(websiteDesignerPath('presets', item.id) as Href)}
                  >
                    <ItemListContent title={item.name} />
                  </Pressable>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <ItemListMenuItem onPress={() => router.push(websiteDesignerPath('presets', item.id) as Href)}>
                        {t('openDesigner')}
                      </ItemListMenuItem>
                      <ItemListMenuItem onPress={() => setDialog({ id: item.id, initialName: item.name })}>
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
        <WebsitePresetDialog
          open={dialog !== null}
          isSaving={saving}
          error={dialogError}
          entityId={dialog?.id}
          initialName={dialog?.initialName}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSubmit={(name) => void handleSubmit(name)}
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
