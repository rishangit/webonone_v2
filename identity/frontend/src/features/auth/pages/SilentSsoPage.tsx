import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  readServiceAuthSession,
  sendIdentitySsoNone,
  sendIdentitySsoSession,
} from '@webonone/platform-embed'
import { IDENTITY_AUTH_STORAGE_KEY } from '@/features/auth/utils/authStorage'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import type { UserProfile } from '@/shared/types/auth.types'

/**
 * Minimal page embedded by consumers to detect an existing Identity session.
 * Posts JWT + user (or none) to the allowlisted parentOrigin — never '*'.
 */
export function SilentSsoPage() {
  const [searchParams] = useSearchParams()
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current) {
      return
    }

    const parentOriginRaw = searchParams.get('parentOrigin')?.trim() ?? ''
    let parentOrigin = ''
    try {
      parentOrigin = new URL(parentOriginRaw).origin
    } catch {
      parentOrigin = ''
    }

    if (!parentOrigin || !isAllowedParentOrigin(parentOrigin)) {
      sentRef.current = true
      return
    }

    sentRef.current = true
    // Read storage directly — do not use loadStoredAuthSession (prompt=login side effects).
    const session = readServiceAuthSession<UserProfile>(IDENTITY_AUTH_STORAGE_KEY)

    if (session?.accessToken && session.user?.id && session.user.email) {
      sendIdentitySsoSession(parentOrigin, {
        accessToken: session.accessToken,
        user: {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          avatarUrl: session.user.avatarUrl ?? null,
        },
      })
      return
    }

    sendIdentitySsoNone(parentOrigin)
  }, [searchParams])

  return <div className="min-h-0 w-full bg-transparent" aria-hidden />
}
