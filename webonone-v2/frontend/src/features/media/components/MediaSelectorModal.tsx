import { useRef } from 'react'
import { MediaSelectorFrame } from '@webonone/media-embed'
import { CustomDialog, Button } from '@webonone/ui-kit'
import { useThemeBridge } from '@/shared/theme/ThemeProviderBridge'
import {
  buildDemoMediaScope,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '../utils/mediaConfig'

interface MediaSelectorModalProps {
  isOpen: boolean
  accessToken: string | null
  folderPath: string
  onClose: () => void
  openKey: number
}

export function MediaSelectorModal({
  isOpen,
  accessToken,
  folderPath,
  onClose,
  openKey,
}: MediaSelectorModalProps) {
  const { broadcastToIframes } = useThemeBridge()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Select file"
      sizeWidth="medium"
      sizeHeight="large"
      className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
      noContentPadding
      disableContentScroll
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <MediaSelectorFrame
        ref={iframeRef}
        key={openKey}
        isOpen={isOpen}
        accessToken={accessToken}
        mediaOrigin={getMediaOrigin()}
        baseUrl={getMediaSelectorUrl()}
        parentOrigin={window.location.origin}
        scope={buildDemoMediaScope()}
        folderPath={folderPath}
        mode="single"
        accept="image/*"
        className="h-full min-h-0 w-full border-0 bg-transparent"
        onLoad={broadcastToIframes}
      />
    </CustomDialog>
  )
}
