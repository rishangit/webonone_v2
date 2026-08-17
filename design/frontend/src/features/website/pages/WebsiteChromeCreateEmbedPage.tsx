import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, useToast } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
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
  const state = useAppSelector((s) => (kind === 'headers' ? s.websiteHeaders : s.websiteFooters))
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

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
      isSaving={state.detailStatus === 'saving'}
      error={state.detailError}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(name, isDefault) => {
        dispatch(actions.saveDetailRequested({ body: { name, isDefault } }))
        toast({ title: t('created') })
        sendPlatformPeerDialogComplete(parentOrigin, requestId)
      }}
    />
  )
}

export function WebsiteThemeCreateEmbedPage() {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

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
      error={detailError}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(name) => {
        dispatch(websiteThemesActions.saveDetailRequested({ body: { name, isActive: true } }))
        toast({ title: t('created') })
        sendPlatformPeerDialogComplete(parentOrigin, requestId)
      }}
    />
  )
}
