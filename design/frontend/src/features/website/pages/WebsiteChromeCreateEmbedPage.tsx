import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { WebsiteChromeDialog, WebsiteThemeDialog } from '../components/WebsiteEntityDialogs'

export function WebsiteChromeCreateEmbedPage({ kind }: { kind: 'headers' | 'footers' }) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const actions = kind === 'headers' ? websiteHeadersActions : websiteFootersActions
  const { detail, detailStatus, detailError } = useAppSelector((s) =>
    kind === 'headers' ? s.websiteHeaders : s.websiteFooters,
  )
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
    <WebsiteChromeDialog
      kind={kind}
      open
      chrome="embed-page"
      isSaving={detailStatus === 'saving'}
      error={awaiting ? detailError : null}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(name, isDefault) => {
        setAwaiting(true)
        dispatch(actions.saveDetailRequested({ body: { name, isDefault } }))
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
      onSubmit={(values) => {
        setAwaiting(true)
        dispatch(websiteThemesActions.saveDetailRequested({ body: { ...values, isActive: true } }))
      }}
    />
  )
}
