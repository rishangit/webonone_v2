import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseCssPaletteSwatches } from '@webonone/theme'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  CSS_PALETTE_PLACEHOLDER,
  parsePaletteSwatchesPayload,
  WEBSITE_PALETTE_IMPORT_DIALOG_SIZE,
  WEBSITE_PALETTE_IMPORT_EMBED_PATH,
} from '../../utils/websitePalette'

export function ThemeCssImportDialog({
  open,
  onOpenChange,
  onImport,
  chrome = 'dialog',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (swatches: string[]) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: WEBSITE_PALETTE_IMPORT_EMBED_PATH,
    title: t('importPaletteTitle'),
    description: t('importPaletteDescription'),
    submitLabel: t('importPaletteApply'),
    ...WEBSITE_PALETTE_IMPORT_DIALOG_SIZE,
    onResult: (payload) => {
      const parsed = parsePaletteSwatchesPayload(payload)
      if (parsed) onImport(parsed)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setText('')
    setError(null)
  }, [chrome, open])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, false)
  }, [dialogRequestId, parentOrigin])

  function submit() {
    const parsed = parseCssPaletteSwatches(text)
    if (!parsed) {
      setError(t('importPaletteInvalid'))
      return
    }
    setError(null)
    onImport(parsed)
    if (chrome === 'dialog') onOpenChange(false)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: submit,
  })

  const body = (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          if (error) setError(null)
        }}
        placeholder={CSS_PALETTE_PLACEHOLDER}
        rows={8}
        className="w-full rounded-md border border-input bg-input-background px-3 py-2 font-mono text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('importPaletteTitle')}
      description={t('importPaletteDescription')}
      sizeWidth={WEBSITE_PALETTE_IMPORT_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_PALETTE_IMPORT_DIALOG_SIZE.sizeHeight}
      onInteractOutside={(event) => event.preventDefault()}
      onPointerDownOutside={(event) => event.preventDefault()}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit}>
            {t('importPaletteApply')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
