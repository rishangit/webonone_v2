import { useState } from 'react'
import { Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react-native'
import {
  Button,
  Card,
  ConfirmDialog,
  ImagePreview,
  Muted,
  Subheading,
  useToast,
  useThemedControlIconColor,
} from '@webonone/mobile-ui'
import { updateCatalogGallery } from '@/features/data/services/catalogEntityApi'
import { uploadCatalogGalleryImage } from '@/features/data/services/catalogMediaApi'
import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { CatalogGalleryImage, CatalogItem } from '@/shared/types/data.types'

const MAX_GALLERY_IMAGES = 24

export function CatalogGalleryTab({
  kind,
  entityId,
  galleryImages,
  canEdit,
  onSaved,
}: {
  kind: CatalogKind
  entityId: string
  galleryImages: CatalogGalleryImage[]
  canEdit: boolean
  onSaved: (item: CatalogItem) => void
}) {
  const { t } = useTranslation(kind)
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const iconColor = useThemedControlIconColor()
  const [saving, setSaving] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const images = galleryImages ?? []

  async function persistGallery(next: CatalogGalleryImage[]) {
    setSaving(true)
    try {
      const updated = await updateCatalogGallery(kind, entityId, next)
      onSaved(updated)
    } catch (err) {
      toast({
        title: t('catalog.galleryUpdateFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddImages() {
    if (images.length >= MAX_GALLERY_IMAGES) return
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    })
    if (result.canceled || !result.assets?.length) return

    setSaving(true)
    try {
      const byId = new Map(images.map((img) => [img.mediaId, img]))
      for (const asset of result.assets) {
        if (byId.size >= MAX_GALLERY_IMAGES) break
        const uploaded = await uploadCatalogGalleryImage({
          kind,
          entityId,
          uri: asset.uri,
          fileName: asset.name ?? 'image',
          mimeType: asset.mimeType ?? 'image/jpeg',
        })
        if (!byId.has(uploaded.mediaId)) {
          byId.set(uploaded.mediaId, uploaded)
        }
      }
      const updated = await updateCatalogGallery(kind, entityId, Array.from(byId.values()))
      onSaved(updated)
    } catch (err) {
      toast({
        title: t('catalog.galleryUpdateFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Subheading>{t('catalog.galleryTitle')}</Subheading>
            <Muted>{t('catalog.galleryDescription', { max: MAX_GALLERY_IMAGES })}</Muted>
          </View>
          {canEdit ? (
            <Button
              size="sm"
              onPress={() => void handleAddImages()}
              disabled={saving || images.length >= MAX_GALLERY_IMAGES}
            >
              {t('catalog.addImages')}
            </Button>
          ) : null}
        </View>

        {images.length === 0 ? (
          <View className="items-center rounded-lg border border-dashed border-border px-4 py-8">
            <Muted>{canEdit ? t('catalog.addGalleryImages') : t('catalog.noGalleryImages')}</Muted>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {images.map((img) => (
              <View key={img.mediaId} className="relative">
                <ImagePreview
                  src={img.url}
                  alt={t('catalog.galleryAlt')}
                  className="h-28 w-28 rounded-lg"
                />
                {canEdit ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('catalog.removeGalleryImage')}
                    disabled={saving}
                    onPress={() => setPendingRemoveId(img.mediaId)}
                    className="absolute right-1 top-1 h-8 w-8 items-center justify-center rounded-md bg-card"
                  >
                    <Trash2 size={16} color={iconColor} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      <ConfirmDialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null)
        }}
        title={t('catalog.removeGalleryTitle')}
        description={t('catalog.removeGalleryDescription')}
        confirmLabel={tc('remove')}
        destructive
        busy={saving}
        onConfirm={() => {
          if (!pendingRemoveId) return
          const next = images.filter((img) => img.mediaId !== pendingRemoveId)
          setPendingRemoveId(null)
          void persistGallery(next)
        }}
      />
    </>
  )
}
