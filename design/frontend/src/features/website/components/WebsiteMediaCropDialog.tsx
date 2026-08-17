import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MediaCropDialogFrame,
  sendMediaConfirm,
  type CropAspectPreset,
  type MediaCropRequestMessage,
} from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { getMediaCropDialogUrl, getMediaOrigin } from '../utils/mediaConfig'

export interface WebsiteCropContext {
  file: File
  folderPath: string
  cropAspectPresets?: CropAspectPreset[]
}

export function useWebsiteMediaCrop() {
  const [cropOpen, setCropOpen] = useState(false)
  const [cropContext, setCropContext] = useState<WebsiteCropContext | null>(null)
  const [cropOpenKey, setCropOpenKey] = useState(0)
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

  const resetCrop = useCallback(() => {
    setCropOpen(false)
    setCropContext(null)
    innerOpenRef.current = false
    blockOuterDismissRef.current = false
    setBlockOuterDismiss(false)
    if (blockOuterDismissTimerRef.current !== null) {
      window.clearTimeout(blockOuterDismissTimerRef.current)
      blockOuterDismissTimerRef.current = null
    }
  }, [])

  const closeCropDialog = useCallback(() => {
    setCropContext(null)
    setCropOpen(false)
    innerOpenRef.current = false
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

  function handleCropOpenChange(next: boolean) {
    if (!next) {
      closeCropDialog()
      return
    }
    setCropOpen(true)
  }

  return {
    cropOpen,
    cropContext,
    cropOpenKey,
    cropIframeRef,
    blockOuterDismiss,
    blockOuterDismissRef,
    innerOpenRef,
    resetCrop,
    closeCropDialog,
    handleCropRequest,
    handleCropOpenChange,
  }
}

interface WebsiteMediaCropDialogProps {
  open: boolean
  openKey: number
  accessToken: string | null
  scope: string
  context: WebsiteCropContext | null
  stackLevel?: number
  iframeRef: RefObject<HTMLIFrameElement | null>
  onOpenChange: (open: boolean) => void
  onCancel: () => void
}

export function WebsiteMediaCropDialog({
  open,
  openKey,
  accessToken,
  scope,
  context,
  stackLevel = 1,
  iframeRef,
  onOpenChange,
  onCancel,
}: WebsiteMediaCropDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('cropImage')}
      description={t('cropDescription')}
      sizeWidth="large"
      sizeHeight="xlarge"
      stackLevel={stackLevel}
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
              onCancel()
            }}
          >
            {tc('cancel')}
          </Button>
          <Button
            type="button"
            className="h-10"
            disabled={!context || !accessToken}
            onClick={() => {
              const iframe = iframeRef.current
              if (iframe) {
                sendMediaConfirm(iframe, getMediaOrigin())
              }
            }}
          >
            {t('cropAndUpload')}
          </Button>
        </>
      }
    >
      {context ? (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <MediaCropDialogFrame
            ref={iframeRef}
            key={openKey}
            isOpen={open}
            accessToken={accessToken}
            mediaOrigin={getMediaOrigin()}
            baseUrl={getMediaCropDialogUrl()}
            parentOrigin={window.location.origin}
            scope={scope}
            folderPath={context.folderPath}
            cropAspectPresets={context.cropAspectPresets}
            cropFile={context.file}
            defaultAspect={context.cropAspectPresets?.[0] ?? '1:1'}
            aspectPresets={context.cropAspectPresets}
            className="h-full min-h-0 w-full flex-1 border-0 bg-transparent"
          />
        </div>
      ) : null}
    </CustomDialog>
  )
}
