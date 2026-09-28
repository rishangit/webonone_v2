import { useState } from 'react'
import { Pressable, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react-native'
import {
  Body,
  Button,
  Card,
  ConfirmDialog,
  ImagePreview,
  Muted,
  Subheading,
  useToast,
  useThemedControlIconColor,
} from '@webonone/mobile-ui'
import { uploadCompanyCatalogGalleryImage } from '@/features/data/company-catalog/services/companyCatalogMediaApi'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import type { CatalogGalleryImage, CatalogEntityKind } from '@/features/sales/types/catalog.types'

const MAX_GALLERY_IMAGES = 24

export function CompanyCatalogGalleryTab({
  companyId,
  kind,
  entityId,
  galleryImages,
  canEdit,
  inheritsLibraryGallery,
  onSaved,
}: {
  companyId: string
  kind: CatalogEntityKind
  entityId: string
  galleryImages: CatalogGalleryImage[]
  canEdit: boolean
  inheritsLibraryGallery?: boolean
  onSaved: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const iconColor = useThemedControlIconColor()
  const [saving, setSaving] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const images = galleryImages ?? []

  async function persistGallery(next: CatalogGalleryImage[]) {
    setSaving(true)
    try {
      await companyCatalogApi.updateGallery(kind, entityId, next)
      onSaved()
    } catch (err) {
      toast({
        title: t('gallery.addGalleryImages'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddImages() {
    if (!canEdit || images.length >= MAX_GALLERY_IMAGES) return
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
        const uploaded = await uploadCompanyCatalogGalleryImage({
          companyId,
          kind,
          entityId,
          uri: asset.uri,
          fileName: asset.name ?? 'image',
          mimeType: asset.mimeType ?? 'image/jpeg',
        })
        byId.set(uploaded.mediaId, uploaded)
      }
      await persistGallery(Array.from(byId.values()))
    } catch (err) {
      toast({
        title: t('gallery.addGalleryImages'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Subheading>{t('detail.tabs.gallery')}</Subheading>
        {inheritsLibraryGallery ? (
          <Muted className="text-sm">{t('gallery.inheritsLibrary')}</Muted>
        ) : null}
      </View>
      {canEdit ? (
        <Button size="sm" onPress={() => void handleAddImages()} disabled={saving}>
          {t('gallery.addImages')}
        </Button>
      ) : null}
      {images.length === 0 ? (
        <Muted>{t('gallery.empty')}</Muted>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {images.map((image) => (
            <View key={image.mediaId} className="relative">
              <ImagePreview src={image.url} alt="" className="h-24 w-24 rounded-md" />
              {canEdit ? (
                <Pressable
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                  onPress={() => setPendingRemoveId(image.mediaId)}
                  accessibilityLabel={tc('remove')}
                >
                  <Trash2 size={14} color={iconColor} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
      <ConfirmDialog
        open={pendingRemoveId != null}
        onOpenChange={(open) => !open && setPendingRemoveId(null)}
        title={t('gallery.removeTitle')}
        description={t('gallery.removeDescription')}
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
    </Card>
  )
}
