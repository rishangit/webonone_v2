import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  appendPromptLogin,
  buildClearFirstLogoutUrl,
} from '@webonone/platform-nav'
import { clearIdentityEmbedSession } from '@webonone/platform-embed'
import type { WebsiteUser } from '@/features/auth/types/auth.types'
import {
  WEBSITE_AUTH_STORAGE_KEY,
  clearWebsiteAuthSession,
  readWebsiteAuthSession,
  writeWebsiteAuthSession,
} from '@/features/auth/utils/authStorage'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import {
  clearWebsiteSsoSkip,
  isWebsiteSsoSkipped,
  markWebsiteSsoSkipped,
} from '@/features/auth/utils/ssoPeerGuard'
import { getWebOnOneOrigin } from '@/features/webonone/utils/webononeConfig'

const LOG = '[website-sso]'
const SSO_BRIDGE_PENDING_KEY = 'website_sso_bridge_pending'
/** Min gap between focus/visibility SSO probes (ms). */
const SSO_PROBE_COOLDOWN_MS = 4000

type WebsiteAuthContextValue = {
  accessToken: string | null
  user: WebsiteUser | null
  isAuthenticated: boolean
  /** True while silent SSO or auth-code exchange is still resolving. */
  isAuthPending: boolean
  setAuthPending: (pending: boolean) => void
  /** Bump when another tab/app may have a new session — silent SSO re-probes. */
  ssoProbeEpoch: number
  requestSsoProbe: (reason: string) => void
  login: (session: { accessToken: string; user: WebsiteUser }) => void
  logout: () => void
}

const WebsiteAuthContext = createContext<WebsiteAuthContextValue | null>(null)

function clearSsoBridgePending(): void {
  try {
    sessionStorage.removeItem(SSO_BRIDGE_PENDING_KEY)
  } catch {
    // ignore
  }
}

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
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const path = window.location.pathname
    // Login page and post-logout land — show Login / stay guest immediately.
    if (path === '/login' || params.get('prompt') === 'login') {
      return false
    }
    if (params.get('code')) {
      return true
    }
  }
  return true
}

export function WebsiteAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadInitialSession)
  const [isAuthPending, setAuthPending] = useState(loadInitialAuthPending)
  const [ssoProbeEpoch, setSsoProbeEpoch] = useState(0)

  useEffect(() => {
    console.log(LOG, 'provider mount', {
      href: window.location.href,
      hasWebsiteAuth: Boolean(readWebsiteAuthSession()),
      isAuthPending,
      prompt: new URLSearchParams(window.location.search).get('prompt'),
      code: Boolean(new URLSearchParams(window.location.search).get('code')),
      ssoBridge: new URLSearchParams(window.location.search).get('sso_bridge'),
      bridgePending: sessionStorage.getItem(SSO_BRIDGE_PENDING_KEY),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount snapshot
  }, [])

  const requestSsoProbe = useCallback((reason: string) => {
    console.log(LOG, 'request SSO probe', { reason })
    clearSsoBridgePending()
    setSsoProbeEpoch((n) => n + 1)
  }, [])

  const login = useCallback((next: { accessToken: string; user: WebsiteUser }) => {
    console.log(LOG, 'login()', { userId: next.user.id, email: next.user.email })
    clearWebsiteSsoSkip('login')
    writeWebsiteAuthSession(next)
    setSession({ accessToken: next.accessToken, user: next.user })
  }, [])

  const logout = useCallback(() => {
    const path = `${window.location.pathname}${window.location.search}` || '/'
    const finalUrl = appendPromptLogin(
      `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`,
    )
    const logoutUrl = buildClearFirstLogoutUrl(
      [getWebOnOneOrigin()],
      getIdentityOrigin(),
      finalUrl,
    )
    const identityOrigin = getIdentityOrigin()

    console.log(LOG, 'logout() start', {
      href: window.location.href,
      finalUrl,
      logoutUrl,
      webononeOrigin: getWebOnOneOrigin(),
      identityOrigin,
      hadWebsiteAuth: Boolean(readWebsiteAuthSession()),
    })

    markWebsiteSsoSkipped('local logout')
    clearWebsiteAuthSession()
    clearSsoBridgePending()

    // Navigate immediately — do not await embed clear or setSession(null) (SSO race).
    void clearIdentityEmbedSession({ identityOrigin })
    console.log(LOG, 'logout() → replace clear-first chain', { logoutUrl })
    window.location.replace(logoutUrl)
  }, [])

  // Same-origin tabs: adopt login (SET) or stay guest after peer logout (CLEAR).
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.storageArea !== localStorage) {
        return
      }
      if (event.key !== WEBSITE_AUTH_STORAGE_KEY) {
        return
      }

      if (event.newValue != null && event.newValue !== '') {
        const stored = readWebsiteAuthSession()
        if (!stored) {
          return
        }
        console.log(LOG, 'storage SET → adopt session from other tab', {
          userId: stored.user.id,
        })
        clearWebsiteSsoSkip('storage SET')
        setSession({ accessToken: stored.accessToken, user: stored.user })
        setAuthPending(false)
        return
      }

      console.log(LOG, 'storage CLEAR → peer/other-tab logout')
      markWebsiteSsoSkipped('storage CLEAR')
      clearSsoBridgePending()
      setSession({ accessToken: null, user: null })
      setAuthPending(false)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // App login is another origin — when this guest tab is focused, re-run SSO bridge.
  useEffect(() => {
    let lastProbeAt = 0

    function maybeProbe(reason: string) {
      if (readWebsiteAuthSession()) {
        return
      }
      const params = new URLSearchParams(window.location.search)
      if (params.get('prompt') === 'login' || params.get('code')) {
        return
      }
      if (isWebsiteSsoSkipped()) {
        console.log(LOG, 'visibility probe blocked (logout guard)', { reason })
        return
      }
      const now = Date.now()
      if (now - lastProbeAt < SSO_PROBE_COOLDOWN_MS) {
        console.log(LOG, 'visibility probe cooldown', { reason })
        return
      }
      lastProbeAt = now
      requestSsoProbe(reason)
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        maybeProbe('visibilitychange')
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        maybeProbe('pageshow-bfcache')
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [requestSsoProbe])

  const value = useMemo<WebsiteAuthContextValue>(
    () => ({
      accessToken: session.accessToken,
      user: session.user,
      isAuthenticated: Boolean(session.accessToken && session.user),
      isAuthPending,
      setAuthPending,
      ssoProbeEpoch,
      requestSsoProbe,
      login,
      logout,
    }),
    [
      isAuthPending,
      login,
      logout,
      requestSsoProbe,
      session.accessToken,
      session.user,
      ssoProbeEpoch,
    ],
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
