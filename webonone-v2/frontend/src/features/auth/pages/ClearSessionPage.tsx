import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clearIdentityEmbedSession } from '@webonone/platform-embed'
import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'
import { parseClearSessionContinue } from '@/features/auth/utils/clearSessionContinue'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { clearSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'

const LOG = '[webonone-clear-session]'

/**
 * Global logout hop: clear webonone_auth + session role + Identity embed
 * partition under this top-level site, then continue.
 */
export function ClearSessionPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const continueRaw = searchParams.get('continue')
    clearWebOnOneAuthStorage()
    clearSessionRoleStorage()
    const parsed = parseClearSessionContinue(continueRaw)
    const next =
      parsed ?? `${window.location.origin}/login?prompt=login`

    console.log(LOG, 'cleared webonone_auth', {
      continueRaw,
      continueAccepted: Boolean(parsed),
      next,
      href: window.location.href,
    })

    // Continue immediately after local clear — embed clear is best-effort.
    void clearIdentityEmbedSession({ identityOrigin: getIdentityOrigin() })
    console.log(LOG, '→ continue', { next })
    window.location.replace(next)
  }, [searchParams])

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">{t('clearSession.signingOut')}</p>
    </div>
  )
}
