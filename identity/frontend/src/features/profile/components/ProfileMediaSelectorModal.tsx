import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
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
  onSelect: (items: MediaItemDto[]) => void
  onClose: () => void
}

function createMediaDialogRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `media-dialog-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function ProfileMediaSelectorModal({
  isOpen,
  accessToken,
  userId,
  openKey,
  onSelect,
  onClose,
}: ProfileMediaSelectorModalProps) {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const [cropOpen, setCropOpen] = useState(false)
  const [cropContext, setCropContext] = useState<CropContext | null>(null)
  const [cropOpenKey, setCropOpenKey] = useState(0)
  /** Stays true briefly after crop closes so the outer overlay blocks pointer fall-through. */
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const blockOuterDismissRef = useRef(false)
  const blockOuterDismissTimerRef = useRef<number | null>(null)
  const innerOpenRef = useRef(false)
  const cropIframeRef = useRef<HTMLIFrameElement>(null)
  const hostRequestIdRef = useRef<string | null>(null)
  const hostParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const scope = buildProfileMediaScope(userId)
  const profileFolderPath = buildProfileFolderPath(userId)

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
      title: t('media.selectPhoto'),
      scope,
      folderPath: profileFolderPath,
      mode: 'single',
      accept: 'image/*',
      selectorUpload: true,
      cropAspectPresets: ['1:1'],
    })
  }, [hostParentOrigin, isOpen, openKey, profileFolderPath, scope, t])

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
        title={t('media.selectPhoto')}
        sizeWidth="medium"
        sizeHeight="large"
        stackLevel={1}
        nestedDismissGuard={cropOpen || blockOuterDismiss}
        className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
        noContentPadding
        disableContentScroll
        footer={
          <Button type="button" variant="outline" onClick={onClose}>
            {tc('close')}
          </Button>
        }
      >
        {!accessToken ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">{t('media.waitingAuth')}</p>
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
        title={t('media.cropTitle')}
        description={t('media.cropDescription')}
        sizeWidth="large"
        sizeHeight="xlarge"
        stackLevel={2}
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
              {tc('cancel')}
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
              {t('media.cropAndUpload')}
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
