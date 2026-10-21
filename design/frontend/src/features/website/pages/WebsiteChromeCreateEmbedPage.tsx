import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteFootersActions, websiteHeadersActions, websiteThemesActions } from '../store'
import { defaultWebsiteTheme } from '../document/palette'
import { WebsiteChromeDialog, WebsiteThemeDialog } from '../components/WebsiteEntityDialogs'

export function WebsiteChromeCreateEmbedPage({ kind }: { kind: 'headers' | 'footers' }) {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const actions = kind === 'headers' ? websiteHeadersActions : websiteFootersActions
  const { detail, detailStatus, detailError } = useAppSelector((s) =>
    kind === 'headers' ? s.websiteHeaders : s.websiteFooters,
  )
  const themes = useAppSelector((s) => s.websiteThemes.items)
  const [awaiting, setAwaiting] = useState(false)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  useEffect(() => {
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    if (id) dispatch(actions.fetchDetailRequested({ id, force: true }))
  }, [actions, dispatch, id])

  useEffect(() => {
    if (!awaiting || !parentOrigin || !requestId) return
    if (detailStatus === 'idle' && detail && (!id || detail.id === id)) {
      setAwaiting(false)
      toast({ title: isEdit ? t('saved') : t('created') })
      sendPlatformPeerDialogComplete(parentOrigin, requestId, { id: detail.id })
    }
    if (detailStatus === 'error') setAwaiting(false)
  }, [awaiting, detail, detailStatus, id, isEdit, parentOrigin, requestId, t, toast])

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const editing = isEdit && detail?.id === id ? detail : null

  return (
    <WebsiteChromeDialog
      kind={kind}
      open
      chrome="embed-page"
      entityId={id}
      initialName={editing?.name}
      initialColorPaletteId={editing?.colorPaletteId ?? null}
      initialPublishStatus={editing?.publishStatus ?? 'draft'}
      theme={defaultWebsiteTheme(themes)}
      isSaving={detailStatus === 'saving'}
      error={awaiting ? detailError : null}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(name, isDefault, colorPaletteId, publishStatus) => {
        setAwaiting(true)
        dispatch(
          actions.saveDetailRequested(
            id
              ? { id, body: { name, colorPaletteId, publishStatus } }
              : { body: { name, isDefault, colorPaletteId, publishStatus } },
          ),
        )
      }}
    />
  )
}

export function WebsiteThemeCreateEmbedPage() {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const [awaiting, setAwaiting] = useState(false)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  useEffect(() => {
    if (!awaiting || !parentOrigin || !requestId) return
    if (detailStatus === 'idle' && detail) {
      setAwaiting(false)
      toast({ title: t('created') })
      sendPlatformPeerDialogComplete(parentOrigin, requestId, { id: detail.id })
    }
    if (detailStatus === 'error') setAwaiting(false)
  }, [awaiting, detail, detailStatus, parentOrigin, requestId, t, toast])

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <WebsiteThemeDialog
      open
      chrome="embed-page"
      isSaving={detailStatus === 'saving'}
      error={awaiting ? detailError : null}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(name, publishStatus) => {
        setAwaiting(true)
        dispatch(websiteThemesActions.saveDetailRequested({ body: { name, isActive: true, publishStatus } }))
      }}
    />
  )
}
