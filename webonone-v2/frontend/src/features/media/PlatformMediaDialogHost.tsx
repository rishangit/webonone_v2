import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  MediaCropDialogFrame,
  MediaSelectorFrame,
  sendMediaConfirm,
  useMediaEmbedMessage,
  type MediaCropRequestMessage,
} from '@webonone/media-embed'
import type {
  PlatformMediaDialogItem,
  PlatformMediaDialogRequestMessage,
  PlatformMediaDialogResponder,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/app/store/hooks'
import { PlatformMediaDialogContext } from '@/features/media/PlatformMediaDialogContext'
import {
  getMediaCropDialogUrl,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '@/features/media/utils/mediaConfig'

type ActiveMediaDialog = {
  request: PlatformMediaDialogRequestMessage
  openKey: number
}

interface CropContext {
  scope: string
  file: File
  folderPath: string
  cropAspectPresets?: MediaCropRequestMessage['cropAspectPresets']
}

export function PlatformMediaDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation(['shell', 'common'])
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [active, setActive] = useState<ActiveMediaDialog | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropContext, setCropContext] = useState<CropContext | null>(null)
  const [cropOpenKey, setCropOpenKey] = useState(0)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const activeResponderRef = useRef<PlatformMediaDialogResponder | null>(null)
  const activeScopeRef = useRef<string | null>(null)
  const blockOuterDismissRef = useRef(false)
  const blockOuterDismissTimerRef = useRef<number | null>(null)
  const cropOpenRef = useRef(false)
  const cropIframeRef = useRef<HTMLIFrameElement>(null)
  const selectorIframeRef = useRef<HTMLIFrameElement>(null)
  const openSequenceRef = useRef(0)
  const [pendingSelection, setPendingSelection] = useState<PlatformMediaDialogItem[]>([])

  const mediaOrigin = getMediaOrigin()
  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    cropOpenRef.current = cropOpen
  }, [cropOpen])

  useEffect(() => {
    return () => {
      activeResponderRef.current?.cancel('unmounted')
      if (blockOuterDismissTimerRef.current !== null) {
        window.clearTimeout(blockOuterDismissTimerRef.current)
      }
    }
  }, [])

  const resetCrop = useCallback(() => {
    setCropOpen(false)
    setCropContext(null)
    cropOpenRef.current = false
    blockOuterDismissRef.current = false
    setBlockOuterDismiss(false)
    if (blockOuterDismissTimerRef.current !== null) {
      window.clearTimeout(blockOuterDismissTimerRef.current)
      blockOuterDismissTimerRef.current = null
    }
  }, [])

  const clearActive = useCallback(() => {
    activeResponderRef.current = null
    activeScopeRef.current = null
    setPendingSelection([])
    setActive(null)
    resetCrop()
  }, [resetCrop])

  const cancelActive = useCallback(
    (reason = 'cancelled') => {
      activeResponderRef.current?.cancel(reason)
      clearActive()
    },
    [clearActive],
  )

  const resolveActive = useCallback(
    (items: PlatformMediaDialogItem[]) => {
      activeResponderRef.current?.resolve(items)
      clearActive()
    },
    [clearActive],
  )

  const closeCropDialog = useCallback(() => {
    setCropContext(null)
    setCropOpen(false)
    cropOpenRef.current = false
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

  const openMediaDialog = useCallback(
    (request: PlatformMediaDialogRequestMessage, responder: PlatformMediaDialogResponder) => {
      activeResponderRef.current?.cancel('replaced')
      openSequenceRef.current += 1
      activeResponderRef.current = responder
      activeScopeRef.current = request.scope
      resetCrop()
      setActive({
        request,
        openKey: openSequenceRef.current,
      })
      setPendingSelection([])
    },
    [resetCrop],
  )

  const handleCropRequest = useCallback((message: MediaCropRequestMessage) => {
    setCropContext({
      scope: message.scope,
      file: message.file,
      folderPath: message.folderPath,
      cropAspectPresets: message.cropAspectPresets,
    })
    setCropOpenKey((key) => key + 1)
    cropOpenRef.current = true
    blockOuterDismissRef.current = true
    setBlockOuterDismiss(true)
    setCropOpen(true)
  }, [])

  const handleMediaCancel = useCallback(() => {
    if (cropOpenRef.current) {
      closeCropDialog()
      return
    }
    cancelActive('cancelled')
  }, [cancelActive, closeCropDialog])

  useMediaEmbedMessage({
    mediaOrigin,
    onCropRequest: handleCropRequest,
    onSelect: (message) => resolveActive(message.items),
    onSelectionChange: (message) => {
      if (message.scope !== activeScopeRef.current) {
        return
      }
      setPendingSelection(message.items)
    },
    onCancel: handleMediaCancel,
  })

  function handleSelectorDone() {
    const iframe = selectorIframeRef.current
    if (!iframe || pendingSelection.length === 0) {
      return
    }
    sendMediaConfirm(iframe, mediaOrigin)
  }

  function handleSelectorOpenChange(next: boolean) {
    if (next) {
      return
    }
    if (cropOpenRef.current) {
      closeCropDialog()
      return
    }
    if (blockOuterDismissRef.current || blockOuterDismiss) {
      return
    }
    cancelActive('cancelled')
  }

  function handleCropOpenChange(next: boolean) {
    if (!next) {
      closeCropDialog()
      return
    }
    cropOpenRef.current = true
    setCropOpen(true)
  }

  return (
    <PlatformMediaDialogContext.Provider value={{ openMediaDialog }}>
      {children}
      {active ? (
        <CustomDialog
          open
          onOpenChange={handleSelectorOpenChange}
          title={active.request.title ?? t('selectMedia')}
          sizeWidth="medium"
          sizeHeight="large"
          nestedDismissGuard={cropOpen || blockOuterDismiss}
          className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
          noContentPadding
          disableContentScroll
          footer={
            <div className="flex w-full items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => cancelActive('cancelled')}>
                {t('common:cancel')}
              </Button>
              <Button
                type="button"
                disabled={pendingSelection.length === 0}
                onClick={handleSelectorDone}
              >
                {t('common:done')}
                {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
              </Button>
            </div>
          }
        >
          {!accessToken ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">{t('waitingAuth')}</p>
            </div>
          ) : (
            <MediaSelectorFrame
              key={active.openKey}
              ref={selectorIframeRef}
              isOpen
              accessToken={accessToken}
              mediaOrigin={mediaOrigin}
              baseUrl={getMediaSelectorUrl()}
              parentOrigin={hostOrigin}
              scope={active.request.scope}
              folderPath={active.request.folderPath}
              scopedRoot={active.request.scopedRoot}
              mode={active.request.mode}
              accept={active.request.accept}
              selectorUpload={active.request.selectorUpload}
              cropAspectPresets={active.request.cropAspectPresets}
              className="h-full min-h-0 w-full border-0 bg-transparent"
            />
          )}
        </CustomDialog>
      ) : null}
      {active && cropContext ? (
        <CustomDialog
          open={cropOpen}
          onOpenChange={handleCropOpenChange}
          title={t('cropImage')}
          description={t('cropDescription')}
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
                {t('common:cancel')}
              </Button>
              <Button
                type="button"
                className="h-10"
                disabled={!accessToken}
                onClick={() => {
                  const iframe = cropIframeRef.current
                  if (iframe) {
                    sendMediaConfirm(iframe, mediaOrigin)
                  }
                }}
              >
                {t('cropAndUpload')}
              </Button>
            </>
          }
        >
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <MediaCropDialogFrame
              ref={cropIframeRef}
              key={cropOpenKey}
              isOpen={cropOpen}
              accessToken={accessToken}
              mediaOrigin={mediaOrigin}
              baseUrl={getMediaCropDialogUrl()}
              parentOrigin={hostOrigin}
              scope={cropContext.scope}
              folderPath={cropContext.folderPath}
              cropAspectPresets={cropContext.cropAspectPresets}
              cropFile={cropContext.file}
              defaultAspect={cropContext.cropAspectPresets?.[0] ?? '1:1'}
              aspectPresets={cropContext.cropAspectPresets}
              className="h-full min-h-0 w-full flex-1 border-0 bg-transparent"
            />
          </div>
        </CustomDialog>
      ) : null}
    </PlatformMediaDialogContext.Provider>
  )
}
