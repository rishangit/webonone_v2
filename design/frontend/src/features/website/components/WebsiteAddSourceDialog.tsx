import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Library, Plus } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { WebsiteLibraryKind } from '../api'
import { WebsiteSourceChoice, WebsiteSourceChoiceGrid } from './WebsiteSourceChoice'

export type WebsiteAddSource = 'library' | 'create'

const SOURCE_SIZE = { sizeWidth: 'medium' as const, sizeHeight: 'auto' as const }

const NOUN_KEYS: Record<WebsiteLibraryKind, string> = {
  pages: 'nounPage',
  headers: 'nounHeader',
  footers: 'nounFooter',
  layouts: 'nounLayout',
  presets: 'nounPreset',
  themes: 'nounTheme',
}

function addSourcePath(kind: WebsiteLibraryKind): string {
  return `/embed/dialogs/website/add-source/${kind}`
}

export function WebsiteAddSourceDialog({
  kind,
  title,
  open,
  onOpenChange,
  onChoose,
  chrome = 'dialog',
}: {
  kind: WebsiteLibraryKind
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoose: (source: WebsiteAddSource) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const dialogRequestId =
    chrome === 'embed-page' ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null) : null
  const [source, setSource] = useState<WebsiteAddSource | null>(null)
  const noun = t(NOUN_KEYS[kind])

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: addSourcePath(kind),
    title,
    description: t('addSourceDescription', { noun }),
    submitLabel: tc('next'),
    ...SOURCE_SIZE,
    onResult: (payload) => {
      const chosen = (payload as { source?: WebsiteAddSource } | undefined)?.source
      onOpenChange(false)
      if (chosen === 'library' || chosen === 'create') onChoose(chosen)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setSource(null)
  }, [chrome, kind, open])

  function confirm() {
    if (!source) return
    if (dialogRequestId && parentOrigin) {
      sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, { source })
      return
    }
    onChoose(source)
    onOpenChange(false)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: confirm,
  })

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, !source)
  }, [dialogRequestId, parentOrigin, source])

  const body = <WebsiteAddSourceFields noun={noun} value={source} onChange={setSource} />

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t('addSourceDescription', { noun })}
      sizeWidth={SOURCE_SIZE.sizeWidth}
      sizeHeight={SOURCE_SIZE.sizeHeight}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" disabled={!source} onClick={confirm}>
            {tc('next')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}

function WebsiteAddSourceFields({
  noun,
  value,
  onChange,
}: {
  noun: string
  value: WebsiteAddSource | null
  onChange: (source: WebsiteAddSource) => void
}) {
  const { t } = useTranslation('website')

  return (
    <WebsiteSourceChoiceGrid>
      <WebsiteSourceChoice
        selected={value === 'library'}
        icon={<Library className="h-5 w-5 text-foreground" aria-hidden />}
        title={t('addFromLibrary')}
        hint={t('addSourceLibraryHint', { noun })}
        onClick={() => onChange('library')}
      />
      <WebsiteSourceChoice
        selected={value === 'create'}
        icon={<Plus className="h-5 w-5 text-foreground" aria-hidden />}
        title={t('createNew')}
        hint={t('addSourceCreateHint', { noun })}
        onClick={() => onChange('create')}
      />
    </WebsiteSourceChoiceGrid>
  )
}
