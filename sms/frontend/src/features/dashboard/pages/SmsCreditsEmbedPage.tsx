import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { SmsCreditsCard } from '@/features/dashboard/components/SmsCreditsCard'
import { smsCreditsActions } from '@/features/dashboard/store'

/** Parent shell (WebOnOne home) collapses the credits iframe when `visible` is false. */
export const SMS_CREDITS_WIDGET_MESSAGE = 'webonone:sms:credits-widget'

/** Chromeless SMS Credits card for the WebOnOne home Dashboard iframe. */
export function SmsCreditsEmbedPage() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const smsCredits = useAppSelector((s) => s.smsCredits)
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const settled = smsCredits.lastFetchedAt != null || smsCredits.status === 'error'
  const visible = smsCredits.configured !== false

  useEffect(() => {
    if (!accessToken) return
    dispatch(smsCreditsActions.loadRequested())
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!parentOrigin || !settled) return
    window.parent.postMessage(
      { type: SMS_CREDITS_WIDGET_MESSAGE, visible },
      parentOrigin,
    )
  }, [parentOrigin, settled, visible])

  function refreshCredits() {
    dispatch(smsCreditsActions.loadRequested({ force: true }))
  }

  if (settled && !visible) {
    return null
  }

  return (
    <div className="w-full overflow-hidden">
      <SmsCreditsCard
        status={smsCredits.status}
        configured={smsCredits.configured}
        balance={smsCredits.balance}
        lastUpdated={smsCredits.lastUpdated}
        error={smsCredits.error}
        hasLoaded={smsCredits.lastFetchedAt != null}
        onRefresh={refreshCredits}
      />
    </div>
  )
}
