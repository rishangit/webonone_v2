import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildLogoutClearChain, performPlatformLogout } from '@webonone/platform-nav'
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

export function WebsiteAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadInitialSession)

  const login = useCallback((next: { accessToken: string; user: WebsiteUser }) => {
    writeWebsiteAuthSession(next)
    setSession({ accessToken: next.accessToken, user: next.user })
  }, [])

  const logout = useCallback(() => {
    clearWebsiteAuthSession()
    setSession({ accessToken: null, user: null })
    const websiteHome = `${window.location.origin}/`
    const postLogoutRedirectUri = buildLogoutClearChain(
      [getWebOnOneOrigin()],
      websiteHome,
    )
    performPlatformLogout(null, {
      identityOrigin: getIdentityOrigin(),
      postLogoutRedirectUri,
    })
  }, [])

  const value = useMemo<WebsiteAuthContextValue>(
    () => ({
      accessToken: session.accessToken,
      user: session.user,
      isAuthenticated: Boolean(session.accessToken && session.user),
      login,
      logout,
    }),
    [login, logout, session.accessToken, session.user],
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
