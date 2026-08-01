import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clearWebsiteAuthSession } from '@/features/auth/utils/authStorage'
import { parseClearSessionContinue } from '@/features/auth/utils/clearSessionContinue'

/**
 * Global logout hop: clear website_auth then continue to the next allowlisted URL.
 */
export function ClearSessionPage() {
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    clearWebsiteAuthSession()
    const next =
      parseClearSessionContinue(searchParams.get('continue')) ?? `${window.location.origin}/`
    window.location.replace(next)
  }, [searchParams])

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Signing out…</p>
    </div>
  )
}
