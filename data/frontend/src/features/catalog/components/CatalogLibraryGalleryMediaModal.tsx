import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MediaCropDialogFrame,
  MediaSelectorFrame,
  sendMediaConfirm,
  useMediaEmbedMessage,
  type CropAspectPreset,
  type MediaCropRequestMessage,
  type MediaItemDto,
} from '@webonone/media-embed'
import {
  isPlatformMediaDialogCancelMessage,
  isPlatformMediaDialogResultMessage,
  resolvePlatformEmbedParentOrigin,
  sendPlatformMediaDialogRequest,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  buildLibraryGalleryFolderPath,
  buildLibraryMediaScope,
  getMediaCropDialogUrl,
  getMediaOrigin,
  getMediaSelectorUrl,
  libraryKindSingular,
  type LibraryGalleryKind,
} from '@/features/media/utils/mediaConfig'

interface CropContext {
  file: File
  folderPath: string
  cropAspectPresets?: CropAspectPreset[]
}

type CatalogLibraryGalleryMediaModalProps = {
  isOpen: boolean
  accessToken: string | null
  kind: LibraryGalleryKind
  entityId: string
  openKey: number
  onSelect: (items: MediaItemDto[]) => void
  onClose: () => void
}

function createMediaDialogRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `media-dialog-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function CatalogLibraryGalleryMediaModal({
  isOpen,
  accessToken,
  kind,
  entityId,
  openKey,
  onSelect,
  onClose,
}: CatalogLibraryGalleryMediaModalProps) {
  const [searchParams] = useSearchParams()
  const [cropOpen, setCropOpen] = useState(false)
  const [cropContext, setCropContext] = useState<CropContext | null>(null)
  const [cropOpenKey, setCropOpenKey] = useState(0)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const blockOuterDismissRef = useRef(false)
  const blockOuterDismissTimerRef = useRef<number | null>(null)
  const innerOpenRef = useRef(false)
  const cropIframeRef = useRef<HTMLIFrameElement>(null)
  const hostRequestIdRef = useRef<string | null>(null)
  const hostParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const scope = buildLibraryMediaScope(kind, entityId)
  const folderPath = buildLibraryGalleryFolderPath(kind, entityId)
  const noun = libraryKindSingular(kind)
  const title = `Add ${noun} gallery images`

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

  useEffect(() => {
    if (!isOpen || !hostParentOrigin) {
      hostRequestIdRef.current = null
      return
    }

    const requestId = createMediaDialogRequestId()
    hostRequestIdRef.current = requestId
    sendPlatformMediaDialogRequest(hostParentOrigin, {
      requestId,
      title,
      scope,
      folderPath,
      mode: 'multiple',
      accept: 'image/*',
      selectorUpload: true,
    })
  }, [folderPath, hostParentOrigin, isOpen, openKey, scope, title])

  useEffect(() => {
    if (!hostParentOrigin) {
      return
    }

    function handleHostMessage(event: MessageEvent) {
      if (event.origin !== hostParentOrigin || event.source !== window.parent) {
        return
      }

      const requestId = hostRequestIdRef.current
      if (!requestId) {
        return
      }

      if (
        isPlatformMediaDialogResultMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        hostRequestIdRef.current = null
        onSelect(event.data.items)
        onClose()
        return
      }

      if (
        isPlatformMediaDialogCancelMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        hostRequestIdRef.current = null
        onClose()
      }
    }

    window.addEventListener('message', handleHostMessage)
    return () => window.removeEventListener('message', handleHostMessage)
  }, [hostParentOrigin, onClose, onSelect])

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
    onSelect: (message) => {
      closeCropDialog()
      onSelect(message.items)
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

  if (hostParentOrigin) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={isOpen}
        onOpenChange={handleSelectorOpenChange}
        title={title}
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
            folderPath={folderPath}
            mode="multiple"
            accept="image/*"
            selectorUpload
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
