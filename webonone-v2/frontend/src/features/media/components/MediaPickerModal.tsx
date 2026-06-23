import { useEffect, useRef, useState } from 'react'
import { MediaPickerFrame, sendMediaConfirm, useMediaEmbedMessage } from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useThemeBridge } from '@/shared/theme/ThemeProviderBridge'
import { buildDemoMediaScope, getMediaOrigin, getMediaPickerUrl } from '../utils/mediaConfig'

interface MediaPickerModalProps {
  isOpen: boolean
  accessToken: string | null
  onClose: () => void
  openKey: number
}

export function MediaPickerModal({ isOpen, accessToken, onClose, openKey }: MediaPickerModalProps) {
  const { broadcastToIframes } = useThemeBridge()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasSelection, setHasSelection] = useState(false)

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onSelectionChange: (message) => {
      setHasSelection(message.items.length > 0)
    },
  })

  useEffect(() => {
    if (isOpen) {
      setHasSelection(false)
    }
  }, [isOpen, openKey])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setHasSelection(false)
      onClose()
    }
  }

  function handleConfirm() {
    if (!iframeRef.current) {
      return
    }
    sendMediaConfirm(iframeRef.current, getMediaOrigin())
  }

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Choose images"
      sizeWidth="medium"
      sizeHeight="large"
      noContentPadding
      disableContentScroll
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!hasSelection} onClick={handleConfirm}>
            Confirm
          </Button>
        </>
      }
    >
      <MediaPickerFrame
        ref={iframeRef}
        key={openKey}
        isOpen={isOpen}
        accessToken={accessToken}
        mediaOrigin={getMediaOrigin()}
        baseUrl={getMediaPickerUrl()}
        parentOrigin={window.location.origin}
        scope={buildDemoMediaScope()}
        folderPath="/"
        mode="multiple"
        accept="image/*"
        className="h-full min-h-0 w-full border-0 bg-transparent"
        onLoad={broadcastToIframes}
      />
    </CustomDialog>
  )
}
