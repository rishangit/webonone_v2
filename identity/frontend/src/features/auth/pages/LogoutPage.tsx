import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingState } from '@webonone/ui-kit'
import { matchesAllowedOrigin, parseAllowlistPatterns } from '@webonone/platform-nav'
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
} from '@/features/auth/utils/authStorage'
import { API_BASE } from '@/shared/services/apiClient'

const POST_LOGOUT_PARAM = 'post_logout_redirect_uri'

function parsePostLogoutRedirectUri(raw: string | null): string | null {
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    const patterns = parseAllowlistPatterns(
      import.meta.env.VITE_ALLOWED_REDIRECT_URIS ?? 'http://localhost:*',
    )
    if (!matchesAllowedOrigin(parsed.origin, patterns)) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

async function revokeIdentitySessions(accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Best-effort — local storage clear still prevents Identity FE SSO
  })
}

export function LogoutPage() {
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const fallbackTarget = `${window.location.origin}/login`
    const postLogout =
      parsePostLogoutRedirectUri(searchParams.get(POST_LOGOUT_PARAM)) ?? fallbackTarget

    const session = loadStoredAuthSession()
    const run = async () => {
      if (session?.accessToken) {
        await revokeIdentitySessions(session.accessToken)
      }
      clearStoredAuthSession()
      window.location.replace(postLogout)
    }

    void run()
  }, [searchParams])

  // No PageShell / AppHeader — logout is a transient hop back to the consumer login.
  return (
    <div className="relative flex h-dvh w-full items-center justify-center">
      <LoadingState overlay label="Signing out…" />
    </div>
  )
}
