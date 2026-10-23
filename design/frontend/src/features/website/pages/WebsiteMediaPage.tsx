import { useCallback, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage } from '@webonone/ui-kit'
import { MediaSelectorFrame, useMediaEmbedMessage } from '@webonone/media-embed'
import { useAppSelector } from '@/app/store/hooks'
import { WebsiteMediaCropDialog, useWebsiteMediaCrop } from '../components/WebsiteMediaCropDialog'
import { WebsiteMediaFolderDialogHost } from '../components/WebsiteMediaFolderDialogHost'
import {
  WEBSITE_LIBRARY_MEDIA_SCOPE,
  buildWebsiteFolderPath,
  buildWebsiteMediaScope,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '../utils/mediaConfig'
import { withAppliedUserTheme } from '../utils/mediaEmbedTheme'

export function WebsiteMediaPage() {
  const { t } = useTranslation('website')
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const companyId = user?.companyId ?? null
  const libraryMedia = user?.role === 'super_admin'
  const crop = useWebsiteMediaCrop()
  const selectorRef = useRef<HTMLIFrameElement>(null)
  const [frameHeight, setFrameHeight] = useState<number | null>(null)
  const handleContentSize = useCallback((message: { height: number }) => {
    if (!Number.isFinite(message.height) || message.height <= 0) return
    setFrameHeight((current) => (current === message.height ? current : message.height))
  }, [])
  const scope = libraryMedia
    ? WEBSITE_LIBRARY_MEDIA_SCOPE
    : companyId
      ? buildWebsiteMediaScope(companyId)
      : ''
  const folderPath = buildWebsiteFolderPath()
  const description = libraryMedia ? t('mediaLibraryDescription') : t('mediaDescription')

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onCropRequest: crop.handleCropRequest,
    onSelect: () => crop.closeCropDialog(),
    onCancel: () => {
      if (crop.innerOpenRef.current) {
        crop.closeCropDialog()
      }
    },
    onContentSize: handleContentSize,
  })

  if (!accessToken) return <Navigate to="/login" replace />
  if (!libraryMedia && !companyId) {
    return (
      <FeaturePage title={t('media')} description={description}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const parentOrigin = window.location.origin

  return (
    <FeaturePage
      title={t('media')}
      description={description}
      className="min-h-full !flex-none [&_.feature-page-body]:!h-auto [&_.feature-page-body]:!min-h-0 [&_.feature-page-body]:!flex-none"
    >
      <MediaSelectorFrame
        ref={selectorRef}
        isOpen
        listPage
        accessToken={accessToken}
        mediaOrigin={getMediaOrigin()}
        baseUrl={withAppliedUserTheme(getMediaSelectorUrl())}
        parentOrigin={parentOrigin}
        scope={scope}
        folderPath={folderPath}
        scopedRoot={folderPath}
        mode="multiple"
        accept="image/*"
        selectorUpload
        className="block w-full shrink-0 border-0"
        style={
          frameHeight
            ? { height: frameHeight, minHeight: frameHeight }
            : { minHeight: 'calc(100dvh - 12rem)' }
        }
        title={t('media')}
      />
      <WebsiteMediaFolderDialogHost selectorRef={selectorRef} />
      <WebsiteMediaCropDialog
        open={crop.cropOpen}
        openKey={crop.cropOpenKey}
        accessToken={accessToken}
        scope={scope}
        context={crop.cropContext}
        stackLevel={1}
        iframeRef={crop.cropIframeRef}
        onOpenChange={crop.handleCropOpenChange}
        onCancel={crop.closeCropDialog}
      />
    </FeaturePage>
  )
}
