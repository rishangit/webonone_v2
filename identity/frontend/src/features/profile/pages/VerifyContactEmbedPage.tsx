import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import {
  VerifyContactOtpDialog,
  type VerifyContactChannel,
} from '../components/VerifyContactOtpDialog'

type VerifyContactEmbedPageProps = {
  channel: VerifyContactChannel
}

/**
 * Body-only contact OTP verify for core-hosted peer dialog
 * (host owns Cancel / Verify footer).
 */
export function VerifyContactEmbedPage({ channel }: VerifyContactEmbedPageProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const user = useAppSelector((s) => s.auth.user)
  const contactHint =
    channel === 'email'
      ? (user?.email?.trim() || 'your email')
      : (user?.phoneNumber?.trim() || 'your phone')

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <VerifyContactOtpDialog
      chrome="embed-page"
      open
      channel={channel}
      contactHint={contactHint}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onVerified={() => {
        /* complete sent inside dialog */
      }}
    />
  )
}
