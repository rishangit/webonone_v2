import { useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PLATFORM_MESSAGE_TYPES, PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformMediaDialog } from '@/features/media/PlatformMediaDialogContext'
import {
  buildCompanyGalleryFolderPath,
  buildCompanyMediaScope,
  COMPANY_MEDIA_SCOPED_ROOT,
} from '@/features/media/utils/mediaConfig'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import type { CompanyGalleryImage } from '@/features/settings/basic/services/companyApi'

const MAX_GALLERY_IMAGES = 24

type CompanyGalleryCardProps = {
  companyId: string
  galleryImages: CompanyGalleryImage[]
  canEdit: boolean
  saving: boolean
}

export function CompanyGalleryCard({
  companyId,
  galleryImages,
  canEdit,
  saving,
}: CompanyGalleryCardProps) {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { openMediaDialog } = usePlatformMediaDialog()
  const images = galleryImages ?? []
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  function persistGallery(next: CompanyGalleryImage[]) {
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: { galleryImages: next },
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
        title: t('companyCards.gallery.addGalleryImages'),
        scope: buildCompanyMediaScope(companyId),
        scopedRoot: COMPANY_MEDIA_SCOPED_ROOT,
        folderPath: buildCompanyGalleryFolderPath(companyId),
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
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">{t('companyCards.gallery.title')}</CardTitle>
              <CardDescription>{t('companyCards.gallery.cardDescription')}</CardDescription>
            </div>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                onClick={openGalleryPicker}
                disabled={saving || images.length >= MAX_GALLERY_IMAGES}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                {t('companyCards.gallery.addImages')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {canEdit ? t('companyCards.gallery.addGalleryImages') : t('companyCards.gallery.empty')}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <li key={img.mediaId} className="group relative overflow-hidden rounded-lg border">
                  <img
                    src={img.url}
                    alt={t('companyCards.gallery.alt')}
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
                      aria-label={t('companyCards.gallery.removeAria')}
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
      <PlatformAlertConfirmDialog
        open={pendingRemoveId !== null}
        title={t('companyCards.gallery.removeTitle')}
        description={t('companyCards.gallery.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
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
