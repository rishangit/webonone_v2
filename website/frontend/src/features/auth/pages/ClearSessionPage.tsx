import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clearIdentityEmbedSession } from '@webonone/platform-embed'
import { clearWebsiteAuthSession } from '@/features/auth/utils/authStorage'
import { parseClearSessionContinue } from '@/features/auth/utils/clearSessionContinue'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'

const LOG = '[website-sso]'

/**
 * Global logout hop: clear website_auth + Identity embed partition under this
 * top-level site, then continue to the next allowlisted URL.
 */
export function ClearSessionPage() {
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const continueRaw = searchParams.get('continue')
    clearWebsiteAuthSession()
    const parsed = parseClearSessionContinue(continueRaw)
    const next = parsed ?? `${window.location.origin}/`

    console.log(LOG, 'clear-session', {
      continueRaw,
      continueAccepted: Boolean(parsed),
      next,
    })

    void clearIdentityEmbedSession({ identityOrigin: getIdentityOrigin() })
    console.log(LOG, 'clear-session → continue', { next })
    window.location.replace(next)
  }, [searchParams])

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Signing out…</p>
    </div>
  )
}
