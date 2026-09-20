import { useState } from 'react'
import { View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  ConfirmDialog,
  FeatureScreen,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ListAddButton,
  ListPageBody,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { WebsiteHubTabs } from '@/features/design/website/components/WebsiteHubTabs'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { useSession } from '@/features/auth/SessionContext'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import {
  deleteWebsiteMedia,
  listWebsiteMedia,
  uploadWebsiteImage,
  type WebsiteMediaItem,
} from '@/shared/services/websiteMediaApi'

export function WebsiteMediaScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { user } = useSession()
  const { canManage, hasCompany } = useDesignPermissions()
  const companyId = user?.companyId ?? ''
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<WebsiteMediaItem | null>(null)

  const list = useServerPaginatedList<WebsiteMediaItem>({
    fetchPage: async (query) => {
      if (!hasCompany || !companyId) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return listWebsiteMedia({
        companyId,
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
      })
    },
  })
  const onScroll = useListPageScroll(list)

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    })
    if (result.canceled || !result.assets?.length) return
    setUploading(true)
    try {
      for (const asset of result.assets) {
        await uploadWebsiteImage({
          companyId,
          uri: asset.uri,
          fileName: asset.name ?? 'image',
          mimeType: asset.mimeType ?? 'image/jpeg',
        })
      }
      toast({ title: t('saved') })
      list.reload()
    } catch (err) {
      toast({
        title: t('saveFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(item: WebsiteMediaItem) {
    setBusyId(item.id)
    try {
      await deleteWebsiteMedia(item.id)
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

  if (!hasCompany) return <WebsiteNeedCompany section="media" description={t('mediaDescription')} />

  return (
    <FeatureScreen title={t('title')} description={t('mediaDescription')} onScroll={onScroll}>
      <WebsiteHubTabs
        section="media"
        actions={
          canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => void handleUpload()} disabled={uploading}>
              {tc('upload')}
            </ListAddButton>
          ) : undefined
        }
      />
      {list.loading || uploading ? <Spinner label={uploading ? t('saving') : t('loading')} /> : null}
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      {!list.loading ? (
        <ListPageBody>
          {list.items.length === 0 ? (
            <ItemListEmpty>{tc('noResults')}</ItemListEmpty>
          ) : (
            <ItemList>
              {list.items.map((item) => (
                <ItemListItem key={item.id}>
                  <View className="flex-row items-start gap-3">
                    <ImagePreview src={item.url} alt={item.fileName ?? item.id} className="h-14 w-14 rounded-md" />
                    <ItemListContent title={item.fileName ?? item.id} subtitle={item.mimeType} />
                  </View>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.fileName ?? item.id })}>
                      <ItemListMenuItem
                        destructive
                        disabled={busyId === item.id}
                        onPress={() => setPendingDelete(item)}
                      >
                        {tc('delete')}
                      </ItemListMenuItem>
                    </ItemListMenu>
                  ) : null}
                </ItemListItem>
              ))}
            </ItemList>
          )}
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={
          pendingDelete
            ? t('deleteConfirm', { name: pendingDelete.fileName ?? pendingDelete.id })
            : t('deleteConfirmFallback')
        }
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
