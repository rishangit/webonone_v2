import { useState } from 'react'
import { Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Spinner,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import {
  listWebsiteMedia,
  uploadWebsiteImage,
  type WebsiteMediaItem,
} from '@/shared/services/websiteMediaApi'
import type { MediaRef } from '@/features/design/website/types'

function toMediaRef(item: WebsiteMediaItem): MediaRef {
  return {
    fileId: item.id,
    url: item.url,
    fileName: item.fileName,
    mimeType: item.mimeType,
  }
}

export function WebsiteImagePickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (media: MediaRef) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { user } = useSession()
  const companyId = user?.companyId ?? ''
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useServerPaginatedList<WebsiteMediaItem>({
    fetchPage: async (query) => {
      if (!companyId) return { items: [], total: 0, page: 1, pageSize: Number(query.pageSize ?? 12) }
      return listWebsiteMedia({
        companyId,
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
      })
    },
  })

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploading(true)
    setError(null)
    try {
      const item = await uploadWebsiteImage({
        companyId,
        uri: asset.uri,
        fileName: asset.name ?? 'image',
        mimeType: asset.mimeType ?? 'image/jpeg',
      })
      onPick(toMediaRef(item))
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('pickImage')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onPress={() => void handleUpload()} disabled={uploading || !companyId}>
            {uploading ? t('saving') : tc('upload')}
          </Button>
        </>
      }
    >
      <View className="gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {list.loading ? <Spinner label={t('loading')} /> : null}
        {!list.loading && list.items.length === 0 ? <ItemListEmpty>{tc('noResults')}</ItemListEmpty> : null}
        <ItemList>
          {list.items.map((item) => (
            <ItemListItem key={item.id}>
              <Pressable
                className="min-w-0 flex-1 flex-row items-center gap-3"
                onPress={() => {
                  onPick(toMediaRef(item))
                  onOpenChange(false)
                }}
              >
                <ImagePreview src={item.url} alt={item.fileName ?? item.id} className="h-14 w-14 rounded-md" />
                <ItemListContent title={item.fileName || item.id} />
              </Pressable>
            </ItemListItem>
          ))}
        </ItemList>
        <TranslatedListPageFooter
          loadedCount={list.items.length}
          totalCount={list.total}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
        />
      </View>
    </CustomDialog>
  )
}
