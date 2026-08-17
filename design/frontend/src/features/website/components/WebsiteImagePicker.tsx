import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MediaSelectorFrame,
  type MediaItemDto,
  useMediaEmbedMessage,
} from '@webonone/media-embed'
import {
  isPlatformMediaDialogCancelMessage,
  isPlatformMediaDialogResultMessage,
  resolvePlatformEmbedParentOrigin,
  sendPlatformMediaDialogRequest,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useAppSelector } from '@/app/store/hooks'
import { WebsiteMediaCropDialog, useWebsiteMediaCrop } from './WebsiteMediaCropDialog'
import {
  buildWebsiteFolderPath,
  buildWebsiteMediaScope,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '../utils/mediaConfig'
import type { MediaRef } from '../types'

function createMediaDialogRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `media-dialog-${Date.now()}`
}

interface WebsiteImagePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (media: MediaRef) => void
}

export function WebsiteImagePicker({ open, onClose, onSelect }: WebsiteImagePickerProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? '')
  const hostParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const hostRequestIdRef = useRef<string | null>(null)
  const [selected, setSelected] = useState<MediaItemDto | null>(null)
  const [openKey, setOpenKey] = useState(0)
  const scope = buildWebsiteMediaScope(companyId)
  const folderPath = buildWebsiteFolderPath()
  const crop = useWebsiteMediaCrop()

  const resetCrop = crop.resetCrop

  useEffect(() => {
    if (!open) {
      hostRequestIdRef.current = null
      setSelected(null)
      resetCrop()
    }
  }, [open, resetCrop])

  useEffect(() => {
    if (!open) return
    setOpenKey((key) => key + 1)
    if (!hostParentOrigin) return
    const requestId = createMediaDialogRequestId()
    hostRequestIdRef.current = requestId
    sendPlatformMediaDialogRequest(hostParentOrigin, {
      requestId,
      title: t('pickImage'),
      scope,
      folderPath,
      scopedRoot: folderPath,
      mode: 'single',
      accept: 'image/*',
      selectorUpload: true,
    })
  }, [folderPath, hostParentOrigin, open, scope, t])

  useEffect(() => {
    if (!hostParentOrigin) return
    function handleHostMessage(event: MessageEvent) {
      if (event.origin !== hostParentOrigin || event.source !== window.parent) return
      const requestId = hostRequestIdRef.current
      if (!requestId) return
      if (isPlatformMediaDialogResultMessage(event.data) && event.data.requestId === requestId) {
        const item = event.data.items[0]
        if (item) onSelect({ fileId: item.id, url: item.url })
        hostRequestIdRef.current = null
        onClose()
      }
      if (isPlatformMediaDialogCancelMessage(event.data) && event.data.requestId === requestId) {
        hostRequestIdRef.current = null
        onClose()
      }
    }
    window.addEventListener('message', handleHostMessage)
    return () => window.removeEventListener('message', handleHostMessage)
  }, [hostParentOrigin, onClose, onSelect])

  const applySelection = useCallback(
    (items: MediaItemDto[]) => {
      const item = items[0]
      if (!item) return
      onSelect({ fileId: item.id, url: item.url })
      onClose()
    },
    [onClose, onSelect],
  )

  const handleSelectionChange = useCallback((items: MediaItemDto[]) => {
    setSelected(items[0] ?? null)
  }, [])

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onCropRequest: crop.handleCropRequest,
    onSelect: (message) => {
      crop.closeCropDialog()
      applySelection(message.items)
    },
    onSelectionChange: (message) => handleSelectionChange(message.items),
    onCancel: () => {
      if (crop.innerOpenRef.current) {
        crop.closeCropDialog()
      }
    },
  })

  function handleSelectorOpenChange(next: boolean) {
    if (next) return
    if (crop.cropOpen || crop.innerOpenRef.current) {
      crop.closeCropDialog()
      return
    }
    if (crop.blockOuterDismissRef.current || crop.blockOuterDismiss) {
      return
    }
    onClose()
  }

  if (hostParentOrigin) return null

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={handleSelectorOpenChange}
        title={t('pickImage')}
        sizeWidth="large"
        sizeHeight="large"
        stackLevel={1}
        nestedDismissGuard={crop.cropOpen || crop.blockOuterDismiss}
        noContentPadding
        disableContentScroll
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                applySelection([selected])
              }}
            >
              {t('pickImage')}
            </Button>
          </>
        }
      >
        {!accessToken || !companyId ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">{t('needCompany')}</p>
          </div>
        ) : (
          <MediaSelectorFrame
            key={openKey}
            isOpen={open}
            accessToken={accessToken}
            mediaOrigin={getMediaOrigin()}
            baseUrl={getMediaSelectorUrl()}
            parentOrigin={window.location.origin}
            scope={scope}
            folderPath={folderPath}
            scopedRoot={folderPath}
            mode="single"
            accept="image/*"
            selectorUpload
            className="h-full min-h-0 w-full border-0 bg-transparent"
            title={t('pickImage')}
          />
        )}
      </CustomDialog>
      <WebsiteMediaCropDialog
        open={crop.cropOpen}
        openKey={crop.cropOpenKey}
        accessToken={accessToken}
        scope={scope}
        context={crop.cropContext}
        stackLevel={2}
        iframeRef={crop.cropIframeRef}
        onOpenChange={crop.handleCropOpenChange}
        onCancel={crop.closeCropDialog}
      />
    </>
  )
}
