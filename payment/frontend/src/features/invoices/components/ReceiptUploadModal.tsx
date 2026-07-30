import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MediaSelectorFrame,
  useMediaEmbedMessage,
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
  RECEIPT_ACCEPT,
  buildInvoiceReceiptFolderPath,
  buildPaymentCompanyMediaScope,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '@/features/media/utils/mediaConfig'

type ReceiptUploadModalProps = {
  isOpen: boolean
  accessToken: string | null
  companyId: string
  invoiceId: string
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

export function ReceiptUploadModal({
  isOpen,
  accessToken,
  companyId,
  invoiceId,
  openKey,
  onSelect,
  onClose,
}: ReceiptUploadModalProps) {
  const [searchParams] = useSearchParams()
  const hostRequestIdRef = useRef<string | null>(null)
  const hostParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const scope = buildPaymentCompanyMediaScope(companyId)
  const folderPath = buildInvoiceReceiptFolderPath(invoiceId)

  useEffect(() => {
    if (!isOpen || !hostParentOrigin) {
      hostRequestIdRef.current = null
      return
    }

    const requestId = createMediaDialogRequestId()
    hostRequestIdRef.current = requestId
    sendPlatformMediaDialogRequest(hostParentOrigin, {
      requestId,
      title: 'Upload invoice receipt',
      scope,
      folderPath,
      mode: 'single',
      accept: RECEIPT_ACCEPT,
      selectorUpload: true,
    })
  }, [folderPath, hostParentOrigin, isOpen, openKey, scope])

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

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onSelect: (message) => {
      onSelect(message.items)
      onClose()
    },
    onCancel: () => {
      onClose()
    },
  })

  if (hostParentOrigin) {
    return null
  }

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Upload invoice receipt"
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
          mode="single"
          accept={RECEIPT_ACCEPT}
          selectorUpload
          className="h-full min-h-0 w-full border-0 bg-transparent"
        />
      )}
    </CustomDialog>
  )
}
