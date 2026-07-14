import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MediaCropDialogFrame,
  MediaSelectorFrame,
  sendMediaConfirm,
  useMediaEmbedMessage,
  type CropAspectPreset,
  type MediaCropRequestMessage,
} from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import {
  buildProfileFolderPath,
  buildProfileMediaScope,
  getMediaCropDialogUrl,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '../utils/mediaConfig'

interface CropContext {
  file: File
  folderPath: string
  cropAspectPresets?: CropAspectPreset[]
}

interface ProfileMediaSelectorModalProps {
  isOpen: boolean
  accessToken: string | null
  userId: string
  openKey: number
  onClose: () => void
}

export function ProfileMediaSelectorModal({
  isOpen,
  accessToken,
  userId,
  openKey,
  onClose,
}: ProfileMediaSelectorModalProps) {
  const [cropOpen, setCropOpen] = useState(false)
  const [cropContext, setCropContext] = useState<CropContext | null>(null)
  const [cropOpenKey, setCropOpenKey] = useState(0)
  /** Stays true briefly after crop closes so the outer overlay blocks pointer fall-through. */
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const blockOuterDismissRef = useRef(false)
  const blockOuterDismissTimerRef = useRef<number | null>(null)
  const innerOpenRef = useRef(false)
  const cropIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    innerOpenRef.current = cropOpen
  }, [cropOpen])

  useEffect(() => {
    if (cropOpen) {
      blockOuterDismissRef.current = true
      setBlockOuterDismiss(true)
    }
  }, [cropOpen])

  useEffect(() => {
    return () => {
      if (blockOuterDismissTimerRef.current !== null) {
        window.clearTimeout(blockOuterDismissTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setCropOpen(false)
      setCropContext(null)
      blockOuterDismissRef.current = false
      setBlockOuterDismiss(false)
    }
  }, [isOpen])

  const closeCropDialog = useCallback(() => {
    setCropContext(null)
    setCropOpen(false)
    blockOuterDismissRef.current = true
    setBlockOuterDismiss(true)
    if (blockOuterDismissTimerRef.current !== null) {
      window.clearTimeout(blockOuterDismissTimerRef.current)
    }
    blockOuterDismissTimerRef.current = window.setTimeout(() => {
      blockOuterDismissRef.current = false
      setBlockOuterDismiss(false)
      blockOuterDismissTimerRef.current = null
    }, 150)
  }, [])

  const handleCropRequest = useCallback((message: MediaCropRequestMessage) => {
    setCropContext({
      file: message.file,
      folderPath: message.folderPath,
      cropAspectPresets: message.cropAspectPresets,
    })
    setCropOpenKey((key) => key + 1)
    innerOpenRef.current = true
    setCropOpen(true)
  }, [])

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onCropRequest: handleCropRequest,
    onSelect: () => {
      closeCropDialog()
    },
    onCancel: () => {
      if (innerOpenRef.current) {
        closeCropDialog()
      }
    },
  })

  function handleSelectorOpenChange(next: boolean) {
    if (next) {
      return
    }
    if (cropOpen || innerOpenRef.current) {
      closeCropDialog()
      return
    }
    if (blockOuterDismissRef.current || blockOuterDismiss) {
      return
    }
    onClose()
  }

  function handleCropOpenChange(next: boolean) {
    if (!next) {
      closeCropDialog()
      return
    }
    setCropOpen(true)
  }

  const scope = buildProfileMediaScope(userId)
  const profileFolderPath = buildProfileFolderPath(userId)

  return (
    <>
      <CustomDialog
        open={isOpen}
        onOpenChange={handleSelectorOpenChange}
        title="Select profile photo"
        sizeWidth="medium"
        sizeHeight="large"
        nestedDismissGuard={cropOpen || blockOuterDismiss}
        className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
        noContentPadding
        disableContentScroll
        footer={
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        }
      >
        {!accessToken ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
          </div>
        ) : (
          <MediaSelectorFrame
            key={openKey}
            isOpen={isOpen}
            accessToken={accessToken}
            mediaOrigin={getMediaOrigin()}
            baseUrl={getMediaSelectorUrl()}
            parentOrigin={window.location.origin}
            scope={scope}
            folderPath={profileFolderPath}
            mode="single"
            accept="image/*"
            selectorUpload
            cropAspectPresets={['1:1']}
            className="h-full min-h-0 w-full border-0 bg-transparent"
          />
        )}
      </CustomDialog>
      <CustomDialog
        open={cropOpen}
        onOpenChange={handleCropOpenChange}
        title="Crop Image"
        description="Drag to reposition. Use zoom and aspect ratio controls to adjust the crop area."
        sizeWidth="large"
        sizeHeight="xlarge"
        stackLevel={1}
        className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
        noContentPadding
        disableContentScroll
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={(event) => {
                event.stopPropagation()
                closeCropDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10"
              disabled={!cropContext || !accessToken}
              onClick={() => {
                const iframe = cropIframeRef.current
                if (iframe) {
                  sendMediaConfirm(iframe, getMediaOrigin())
                }
              }}
            >
              Crop & Upload
            </Button>
          </>
        }
      >
        {cropContext ? (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <MediaCropDialogFrame
              ref={cropIframeRef}
              key={cropOpenKey}
              isOpen={cropOpen}
              accessToken={accessToken}
              mediaOrigin={getMediaOrigin()}
              baseUrl={getMediaCropDialogUrl()}
              parentOrigin={window.location.origin}
              scope={scope}
              folderPath={cropContext.folderPath}
              cropAspectPresets={cropContext.cropAspectPresets}
              cropFile={cropContext.file}
              defaultAspect={cropContext.cropAspectPresets?.[0] ?? '1:1'}
              aspectPresets={cropContext.cropAspectPresets}
              className="h-full min-h-0 w-full flex-1 border-0 bg-transparent"
            />
          </div>
        ) : null}
      </CustomDialog>
    </>
  )
}
