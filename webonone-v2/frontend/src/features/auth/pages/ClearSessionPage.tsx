import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'
import { parseClearSessionContinue } from '@/features/auth/utils/clearSessionContinue'
import { clearSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'

/**
 * Global logout hop: clear webonone_auth + session role then continue.
 */
export function ClearSessionPage() {
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    clearWebOnOneAuthStorage()
    clearSessionRoleStorage()
    const next =
      parseClearSessionContinue(searchParams.get('continue')) ??
      `${window.location.origin}/login?prompt=login`
    window.location.replace(next)
  }, [searchParams])

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Signing out…</p>
    </div>
  )
}
