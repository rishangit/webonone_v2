import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Trash2 } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@webonone/ui-kit'
import { CatalogLibraryGalleryMediaModal } from '@/features/catalog/components/CatalogLibraryGalleryMediaModal'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { type LibraryGalleryKind } from '@/features/media/utils/mediaConfig'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogGalleryImage } from '@/shared/types/data.types'

const MAX_GALLERY_IMAGES = 24

type CatalogLibraryGalleryCardProps = {
  kind: LibraryGalleryKind
  entityId: string
  galleryImages: CatalogGalleryImage[]
  accessToken: string | null
  canEdit: boolean
  onSaved: (galleryImages: CatalogGalleryImage[]) => void
}

export function CatalogLibraryGalleryCard({
  kind,
  entityId,
  galleryImages,
  accessToken,
  canEdit,
  onSaved,
}: CatalogLibraryGalleryCardProps) {
  const { t } = useTranslation(kind)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerKey, setPickerKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const images = galleryImages ?? []

  async function persistGallery(next: CatalogGalleryImage[]) {
    setSaving(true)
    setError(null)
    try {
      const updated =
        kind === 'products'
          ? await dataApi.updateProductGallery(entityId, next)
          : kind === 'services'
            ? await dataApi.updateServiceGallery(entityId, next)
            : await dataApi.updateSpaceGallery(entityId, next)
      onSaved(updated.galleryImages ?? next)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.galleryUpdateFailed'))
    } finally {
      setSaving(false)
    }
  }

  function openGalleryPicker() {
    if (images.length >= MAX_GALLERY_IMAGES) return
    setPickerKey((key) => key + 1)
    setPickerOpen(true)
  }

  function handleRemove(mediaId: string) {
    void persistGallery(images.filter((img) => img.mediaId !== mediaId))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">{t('catalog.galleryTitle')}</CardTitle>
              <CardDescription>
                {t('catalog.galleryDescription', { max: MAX_GALLERY_IMAGES })}
              </CardDescription>
            </div>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                onClick={openGalleryPicker}
                disabled={saving || images.length >= MAX_GALLERY_IMAGES}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                {t('catalog.addImages')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {images.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {canEdit ? t('catalog.addGalleryImages') : t('catalog.noGalleryImages')}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <li key={img.mediaId} className="group relative overflow-hidden rounded-lg border">
                  <img
                    src={img.url}
                    alt={t('catalog.galleryAlt')}
                    className="aspect-square w-full object-cover"
                  />
                  {canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setPendingRemoveId(img.mediaId)}
                      disabled={saving}
                      aria-label={t('catalog.removeGalleryImage')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CatalogLibraryGalleryMediaModal
        isOpen={pickerOpen}
        accessToken={accessToken}
        kind={kind}
        entityId={entityId}
        openKey={pickerKey}
        onSelect={(items) => {
          const byId = new Map(images.map((img) => [img.mediaId, img]))
          for (const item of items) {
            if (!item.id || !item.url) continue
            if (byId.has(item.id)) continue
            byId.set(item.id, { mediaId: item.id, url: item.url })
            if (byId.size >= MAX_GALLERY_IMAGES) break
          }
          void persistGallery(Array.from(byId.values()))
        }}
        onClose={() => setPickerOpen(false)}
      />

      <PlatformAlertConfirmDialog
        open={pendingRemoveId !== null}
        title={t('catalog.removeGalleryTitle')}
        description={t('catalog.removeGalleryDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:remove')}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null)
        }}
        onConfirm={() => {
          if (pendingRemoveId) handleRemove(pendingRemoveId)
        }}
      />
    </>
  )
}
