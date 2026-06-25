import { useRef } from 'react'
import { MediaUploadDialogFrame } from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useThemeBridge } from '@/shared/theme/ThemeProviderBridge'
import {
  buildDemoMediaScope,
  getMediaOrigin,
  getMediaUploadDialogUrl,
} from '../utils/mediaConfig'

interface MediaUploadDialogModalProps {
  isOpen: boolean
  accessToken: string | null
  folderPath: string
  onClose: () => void
  openKey: number
}

export function MediaUploadDialogModal({
  isOpen,
  accessToken,
  folderPath,
  onClose,
  openKey,
}: MediaUploadDialogModalProps) {
  const { broadcastToIframes } = useThemeBridge()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Upload file"
      sizeWidth="medium"
      sizeHeight="large"
      noContentPadding
      disableContentScroll
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <MediaUploadDialogFrame
        ref={iframeRef}
        key={openKey}
        isOpen={isOpen}
        accessToken={accessToken}
        mediaOrigin={getMediaOrigin()}
        baseUrl={getMediaUploadDialogUrl()}
        parentOrigin={window.location.origin}
        scope={buildDemoMediaScope()}
        folderPath={folderPath}
        mediaType="image"
        autoClose
        className="h-full min-h-0 w-full border-0 bg-transparent"
        onLoad={broadcastToIframes}
      />
    </CustomDialog>
  )
}
