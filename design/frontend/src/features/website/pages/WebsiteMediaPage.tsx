import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage } from '@webonone/ui-kit'
import { MediaSelectorFrame, useMediaEmbedMessage } from '@webonone/media-embed'
import { useAppSelector } from '@/app/store/hooks'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteMediaCropDialog, useWebsiteMediaCrop } from '../components/WebsiteMediaCropDialog'
import {
  buildWebsiteFolderPath,
  buildWebsiteMediaScope,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '../utils/mediaConfig'

export function WebsiteMediaPage() {
  const { t } = useTranslation('website')
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? null)
  const crop = useWebsiteMediaCrop()
  const scope = companyId ? buildWebsiteMediaScope(companyId) : ''
  const folderPath = buildWebsiteFolderPath()

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onCropRequest: crop.handleCropRequest,
    onSelect: () => crop.closeCropDialog(),
    onCancel: () => {
      if (crop.innerOpenRef.current) {
        crop.closeCropDialog()
      }
    },
  })

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('mediaDescription')}>
        <WebsiteHubTabs section="media" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const parentOrigin = window.location.origin

  return (
    <FeaturePage title={t('title')} description={t('mediaDescription')}>
      <WebsiteHubTabs section="media" />
      <div className="min-h-[480px] overflow-hidden rounded-lg border border-[hsl(var(--glass-border))]">
        <MediaSelectorFrame
          isOpen
          accessToken={accessToken}
          mediaOrigin={getMediaOrigin()}
          baseUrl={getMediaSelectorUrl()}
          parentOrigin={parentOrigin}
          scope={scope}
          folderPath={folderPath}
          scopedRoot={folderPath}
          mode="multiple"
          accept="image/*"
          selectorUpload
          className="h-[min(70vh,720px)] w-full border-0"
          title={t('media')}
        />
      </div>
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
