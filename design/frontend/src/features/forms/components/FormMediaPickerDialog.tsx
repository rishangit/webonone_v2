import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HostedMediaPreviewDialog,
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
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  buildFormMediaFolderPath,
  buildFormMediaScope,
  getFormMediaOrigin,
  getFormMediaSelectorUrl,
} from '@/features/forms/utils/formMediaConfig'
import type { FormMediaFileRef } from '@/shared/types/design.types'

function createMediaDialogRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `media-dialog-${Date.now()}`
}

function toFormMediaRef(item: MediaItemDto): FormMediaFileRef {
  return {
    fileId: item.id,
    url: item.url,
    fileName: item.fileName,
    mimeType: item.mimeType,
  }
}

interface FormMediaPickerDialogProps {
  open: boolean
  allowMultiple: boolean
  onClose: () => void
  onSelect: (items: FormMediaFileRef[]) => void
}

export function FormMediaPickerDialog({
  open,
  allowMultiple,
  onClose,
  onSelect,
}: FormMediaPickerDialogProps) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? '')
  const hostParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const hostRequestIdRef = useRef<string | null>(null)
  const [selected, setSelected] = useState<MediaItemDto[]>([])
  const [previewGuard, setPreviewGuard] = useState(false)
  const previewGuardRef = useRef(false)
  const [openKey, setOpenKey] = useState(0)
  const scope = buildFormMediaScope(companyId)
  const folderPath = buildFormMediaFolderPath()
  const mode = allowMultiple ? 'multiple' : 'single'

  useEffect(() => {
    if (!open) {
      hostRequestIdRef.current = null
      setSelected([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setOpenKey((key) => key + 1)
    if (!hostParentOrigin) return
    const requestId = createMediaDialogRequestId()
    hostRequestIdRef.current = requestId
    sendPlatformMediaDialogRequest(hostParentOrigin, {
      requestId,
      title: t('pickDocuments'),
      scope,
      folderPath,
      scopedRoot: folderPath,
      mode,
      accept: '*/*',
      selectorUpload: true,
    })
  }, [allowMultiple, folderPath, hostParentOrigin, mode, open, scope, t])

  useEffect(() => {
    if (!hostParentOrigin) return
    function handleHostMessage(event: MessageEvent) {
      if (event.origin !== hostParentOrigin || event.source !== window.parent) return
      const requestId = hostRequestIdRef.current
      if (!requestId) return
      if (isPlatformMediaDialogResultMessage(event.data) && event.data.requestId === requestId) {
        onSelect(event.data.items.map(toFormMediaRef))
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
      if (items.length === 0) return
      onSelect(items.map(toFormMediaRef))
      onClose()
    },
    [onClose, onSelect],
  )

  const handleSelectionChange = useCallback((items: MediaItemDto[]) => {
    setSelected(items)
  }, [])

  useMediaEmbedMessage({
    mediaOrigin: getFormMediaOrigin(),
    onSelect: (message) => {
      applySelection(message.items)
    },
    onSelectionChange: (message) => handleSelectionChange(message.items),
  })

  const handlePreviewGuard = useCallback((guard: boolean) => {
    previewGuardRef.current = guard
    setPreviewGuard(guard)
  }, [])

  if (hostParentOrigin) return null

  return (
    <>
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && previewGuardRef.current) return
        if (!next) onClose()
      }}
      nestedDismissGuard={previewGuard}
      title={t('pickDocuments')}
      sizeWidth="large"
      sizeHeight="large"
      stackLevel={1}
      noContentPadding
      disableContentScroll
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button
            type="button"
            className="h-10 px-4"
            disabled={selected.length === 0}
            onClick={() => applySelection(selected)}
          >
            {t('attachSelected')}
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
          mediaOrigin={getFormMediaOrigin()}
          baseUrl={getFormMediaSelectorUrl()}
          parentOrigin={window.location.origin}
          scope={scope}
          folderPath={folderPath}
          scopedRoot={folderPath}
          mode={mode}
          accept="*/*"
          selectorUpload
          className="h-full min-h-0 w-full border-0 bg-transparent"
          title={t('pickDocuments')}
        />
      )}
    </CustomDialog>
    <HostedMediaPreviewDialog
      mediaOrigin={getFormMediaOrigin()}
      stackLevel={2}
      closeLabel={tc('close')}
      onGuardChange={handlePreviewGuard}
    />
    </>
  )
}
