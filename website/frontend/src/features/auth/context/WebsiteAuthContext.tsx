import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  appendPromptLogin,
  buildLogoutClearChain,
  performPlatformLogout,
} from '@webonone/platform-nav'
import { clearIdentityEmbedSession } from '@webonone/platform-embed'
import type { WebsiteUser } from '@/features/auth/types/auth.types'
import {
  clearWebsiteAuthSession,
  readWebsiteAuthSession,
  writeWebsiteAuthSession,
} from '@/features/auth/utils/authStorage'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { getWebOnOneOrigin } from '@/features/webonone/utils/webononeConfig'

type WebsiteAuthContextValue = {
  accessToken: string | null
  user: WebsiteUser | null
  isAuthenticated: boolean
  /** True while silent SSO or auth-code exchange is still resolving. */
  isAuthPending: boolean
  setAuthPending: (pending: boolean) => void
  login: (session: { accessToken: string; user: WebsiteUser }) => void
  logout: () => void
}

const WebsiteAuthContext = createContext<WebsiteAuthContextValue | null>(null)

function loadInitialSession(): { accessToken: string | null; user: WebsiteUser | null } {
  const stored = readWebsiteAuthSession()
  if (!stored) {
    return { accessToken: null, user: null }
  }
  return { accessToken: stored.accessToken, user: stored.user }
}

/** Guests start pending until silent SSO / code bootstrap settles; stored session is ready. */
function loadInitialAuthPending(): boolean {
  if (readWebsiteAuthSession()) {
    return false
  }
  // Post-logout land with prompt=login — do not hold chrome in a pending state.
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('prompt') === 'login' || params.get('code')) {
      return Boolean(params.get('code'))
    }
  }
  return true
}

export function WebsiteAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadInitialSession)
  const [isAuthPending, setAuthPending] = useState(loadInitialAuthPending)

  const login = useCallback((next: { accessToken: string; user: WebsiteUser }) => {
    writeWebsiteAuthSession(next)
    setSession({ accessToken: next.accessToken, user: next.user })
  }, [])

  const logout = useCallback(() => {
    clearWebsiteAuthSession()
    setSession({ accessToken: null, user: null })
    setAuthPending(false)
    // Land on current page with prompt=login so silent SSO does not re-auth.
    const path = `${window.location.pathname}${window.location.search}` || '/'
    const finalUrl = appendPromptLogin(
      `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`,
    )
    const postLogoutRedirectUri = buildLogoutClearChain([getWebOnOneOrigin()], finalUrl)
    const identityOrigin = getIdentityOrigin()

    void clearIdentityEmbedSession({ identityOrigin }).finally(() => {
      performPlatformLogout(null, {
        identityOrigin,
        postLogoutRedirectUri,
      })
    })
  }, [])

  const value = useMemo<WebsiteAuthContextValue>(
    () => ({
      accessToken: session.accessToken,
      user: session.user,
      isAuthenticated: Boolean(session.accessToken && session.user),
      isAuthPending,
      setAuthPending,
      login,
      logout,
    }),
    [isAuthPending, login, logout, session.accessToken, session.user],
  )

  return <WebsiteAuthContext.Provider value={value}>{children}</WebsiteAuthContext.Provider>
}

export function useWebsiteAuth(): WebsiteAuthContextValue {
  const ctx = useContext(WebsiteAuthContext)
  if (!ctx) {
    throw new Error('useWebsiteAuth must be used within WebsiteAuthProvider')
  }
  return ctx
}
