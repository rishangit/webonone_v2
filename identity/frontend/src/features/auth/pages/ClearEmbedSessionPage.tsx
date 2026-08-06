import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  clearServiceAuthSession,
  readServiceAuthSession,
  sendIdentitySessionCleared,
} from '@webonone/platform-embed'
import { IDENTITY_AUTH_STORAGE_KEY } from '@/features/auth/utils/authStorage'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { API_BASE } from '@/shared/services/apiClient'
import type { UserProfile } from '@/shared/types/auth.types'

async function revokeIdentitySessions(accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Best-effort — local storage clear still prevents embed SSO
  })
}

/**
 * Embedded by consumers on logout to clear Identity storage in the consumer's
 * storage partition (iframe under WebOnOne/website), then notify the parent.
 */
export function ClearEmbedSessionPage() {
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
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
      startedRef.current = true
      return
    }

    startedRef.current = true

    const session = readServiceAuthSession<UserProfile>(IDENTITY_AUTH_STORAGE_KEY)
    clearServiceAuthSession(IDENTITY_AUTH_STORAGE_KEY)

    const run = async () => {
      if (session?.accessToken) {
        await revokeIdentitySessions(session.accessToken)
      }
      sendIdentitySessionCleared(parentOrigin)
    }

    void run()
  }, [searchParams])

  return <div className="min-h-0 w-full bg-transparent" aria-hidden />
}
