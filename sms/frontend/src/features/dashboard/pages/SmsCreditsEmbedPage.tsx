import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { SmsCreditsCard } from '@/features/dashboard/components/SmsCreditsCard'
import { smsCreditsActions } from '@/features/dashboard/store'
import { useNavigateSms } from '@/features/shell/utils/navigateSms'

/** Chromeless SMS Credits card for the WebOnOne home Dashboard iframe. */
export function SmsCreditsEmbedPage() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const smsCredits = useAppSelector((s) => s.smsCredits)
  const { goToDevicesSettings } = useNavigateSms()

  useEffect(() => {
    if (!accessToken) return
    dispatch(smsCreditsActions.loadRequested())
  }, [accessToken, dispatch])

  function refreshCredits() {
    dispatch(smsCreditsActions.loadRequested({ force: true }))
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
        onConfigure={goToDevicesSettings}
      />
    </div>
  )
}
