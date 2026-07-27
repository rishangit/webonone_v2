import { ImagePlus, Trash2 } from 'lucide-react'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { usePlatformMediaDialog } from '@/features/media/PlatformMediaDialogContext'
import {
  buildCatalogEntityGalleryFolderPath,
  buildCompanyMediaScope,
} from '@/features/media/utils/mediaConfig'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type {
  CatalogGalleryImage,
  CatalogGalleryKind,
} from '@/features/company-catalog/types/companyCatalog.types'
import { singularLabel } from '@/features/company-catalog/types/companyCatalog.types'

const MAX_GALLERY_IMAGES = 24

type CatalogEntityGalleryCardProps = {
  companyId: string
  kind: CatalogGalleryKind
  entityId: string
  galleryImages: CatalogGalleryImage[]
  canEdit: boolean
  saving: boolean
}

export function CatalogEntityGalleryCard({
  companyId,
  kind,
  entityId,
  galleryImages,
  canEdit,
  saving,
}: CatalogEntityGalleryCardProps) {
  const dispatch = useAppDispatch()
  const { openMediaDialog } = usePlatformMediaDialog()
  const images = galleryImages ?? []
  const noun = singularLabel(kind).toLowerCase()

  function persistGallery(next: CatalogGalleryImage[]) {
    dispatch(
      companyCatalogActions.updateGalleryRequested({
        kind,
        id: entityId,
        galleryImages: next,
      }),
    )
  }

  function openGalleryPicker() {
    const remaining = MAX_GALLERY_IMAGES - images.length
    if (remaining <= 0) return

    openMediaDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_REQUEST,
        requestId: crypto.randomUUID(),
        title: `Add ${noun} gallery images`,
        scope: buildCompanyMediaScope(companyId),
        folderPath: buildCatalogEntityGalleryFolderPath(companyId, kind, entityId),
        mode: 'multiple',
        accept: 'image/*',
        selectorUpload: true,
      },
      {
        resolve: (items) => {
          if (items.length === 0) return
          const byId = new Map(images.map((img) => [img.mediaId, img]))
          for (const item of items) {
            if (!item.id || !item.url) continue
            if (byId.has(item.id)) continue
            byId.set(item.id, { mediaId: item.id, url: item.url })
            if (byId.size >= MAX_GALLERY_IMAGES) break
          }
          persistGallery(Array.from(byId.values()))
        },
        cancel: () => {},
      },
    )
  }

  function handleRemove(mediaId: string) {
    persistGallery(images.filter((img) => img.mediaId !== mediaId))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Gallery</CardTitle>
            <CardDescription>
              Images for this {noun} (up to {MAX_GALLERY_IMAGES})
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
              Add images
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {canEdit ? 'Add gallery images' : 'No gallery images yet'}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <li key={img.mediaId} className="group relative overflow-hidden rounded-lg border">
                <img
                  src={img.url}
                  alt={`${noun} gallery`}
                  className="aspect-square w-full object-cover"
                />
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleRemove(img.mediaId)}
                    disabled={saving}
                    aria-label="Remove gallery image"
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
  )
}
