import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeLocale, type AppLocale } from '@webonone/i18n'
import { authApi } from './authApi'
import { getGoogleIdToken, GoogleSignInCancelledError } from './googleSignIn'
import {
  findMatchingSessionRole,
  sessionRoleApi,
  type SessionRoleOption,
} from './sessionRoleApi'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { setUnauthorizedHandler } from '@/shared/services/apiClient'
import { secureStorage } from '@/shared/services/secureStorage'
import type { UserProfile } from '@/shared/types'
import { unregisterPushDevice } from '@/features/notifications/utils/pushNotifications'

interface SessionContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  needsRoleSelection: boolean
  isBlocked: boolean
  blockReason: string | null
  roleOptions: SessionRoleOption[]
  locale: AppLocale
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  selectRole: (option: SessionRoleOption) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  setLocale: (locale: AppLocale) => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

const NO_ROLES = 'No accounts are available for this user.'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isBootstrapping, setBootstrapping] = useState(true)
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false)
  const [isBlocked, setBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  const [roleOptions, setRoleOptions] = useState<SessionRoleOption[]>([])
  const [locale, setLocaleState] = useState<AppLocale>('en')
  const loggingOutRef = useRef(false)

  const clearSessionState = useCallback(() => {
    setUser(null)
    setNeedsRoleSelection(false)
    setBlocked(false)
    setBlockReason(null)
    setRoleOptions([])
  }, [])

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    try {
      await unregisterPushDevice()
      await secureStorage.clearAccessToken()
      await secureStorage.clearSessionRole()
      await secureStorage.clearDevice()
      clearSessionState()
    } finally {
      loggingOutRef.current = false
    }
  }, [clearSessionState])

  const applyLocalLocale = useCallback(async (next: AppLocale) => {
    const lng = normalizeLocale(next)
    setLocaleState(lng)
    await secureStorage.setLocale(lng)
    await changeAppLocale(lng)
  }, [])

  const applySessionRole = useCallback(async (option: SessionRoleOption, accessToken: string) => {
    const { accessToken: nextToken } = await sessionRoleApi.reissueSessionRole(
      accessToken,
      option.role,
      option.companyId,
    )
    await secureStorage.setAccessToken(nextToken)
    await secureStorage.setSessionRole({
      role: option.role,
      companyId: option.companyId,
      companyName: option.companyName,
      accountKind: option.accountKind,
    })

    const profile = await authApi.fetchProfile({
      companyName: option.companyName,
      accountKind: option.accountKind,
    })
    setUser(profile)
    setNeedsRoleSelection(false)
    setBlocked(false)
    setBlockReason(null)
    if (profile.locale === 'en' || profile.locale === 'si') {
      await applyLocalLocale(profile.locale)
    }
  }, [applyLocalLocale])

  const resolveRolesAfterAuth = useCallback(
    async (accessToken: string, opts?: { preferSticky?: boolean; clearSticky?: boolean }) => {
      if (opts?.clearSticky) {
        await secureStorage.clearSessionRole()
      }

      const options = await sessionRoleApi.getAssumableRoles(accessToken)
      setRoleOptions(options)

      if (options.length === 0) {
        setUser(null)
        setNeedsRoleSelection(false)
        setBlocked(true)
        setBlockReason(NO_ROLES)
        return
      }

      if (opts?.preferSticky) {
        const sticky = await secureStorage.getSessionRole()
        if (sticky) {
          const match = findMatchingSessionRole(options, sticky.role, sticky.companyId)
          if (match) {
            await applySessionRole(match, accessToken)
            return
          }
          await secureStorage.clearSessionRole()
        }
      }

      if (options.length === 1) {
        await applySessionRole(options[0], accessToken)
        return
      }

      setUser(null)
      setBlocked(false)
      setBlockReason(null)
      setNeedsRoleSelection(true)
    },
    [applySessionRole],
  )

  const refreshProfile = useCallback(async () => {
    const sticky = await secureStorage.getSessionRole()
    const profile = await authApi.fetchProfile({
      companyName: sticky?.companyName ?? null,
      accountKind: sticky?.accountKind,
    })
    setUser(profile)
    setBlocked(false)
    setBlockReason(null)
    setNeedsRoleSelection(false)
    if (profile.locale === 'en' || profile.locale === 'si') {
      await applyLocalLocale(profile.locale)
    }
  }, [applyLocalLocale])

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await authApi.login(email, password)
      await secureStorage.setAccessToken(accessToken)
      await resolveRolesAfterAuth(accessToken, { clearSticky: true })
    },
    [resolveRolesAfterAuth],
  )

  const loginWithGoogle = useCallback(async () => {
    try {
      const idToken = await getGoogleIdToken()
      const { accessToken } = await authApi.googleLogin(idToken)
      await secureStorage.setAccessToken(accessToken)
      await resolveRolesAfterAuth(accessToken, { clearSticky: true })
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) return
      throw err
    }
  }, [resolveRolesAfterAuth])

  const selectRole = useCallback(
    async (option: SessionRoleOption) => {
      const token = await secureStorage.getAccessToken()
      if (!token) {
        throw new Error('Session expired. Please sign in again.')
      }
      await applySessionRole(option, token)
    },
    [applySessionRole],
  )

  const setLocale = useCallback(
    async (next: AppLocale) => {
      await applyLocalLocale(next)
      const token = await secureStorage.getAccessToken()
      if (token) {
        try {
          await sessionRoleApi.patchLocale(token, next)
        } catch {
          // Locale still applies locally if Identity is unreachable.
        }
      }
    },
    [applyLocalLocale],
  )

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout()
    })
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    let active = true
    void (async () => {
      const storedLocale = await secureStorage.getLocale()
      if (storedLocale && active) {
        setLocaleState(storedLocale)
        await changeAppLocale(storedLocale)
      }
      const token = await secureStorage.getAccessToken()
      if (token) {
        try {
          await resolveRolesAfterAuth(token, { preferSticky: true })
        } catch {
          await secureStorage.clearAccessToken()
          await secureStorage.clearSessionRole()
          if (active) clearSessionState()
        }
      }
      if (active) setBootstrapping(false)
    })()
    return () => {
      active = false
    }
    // Cold-start restore only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount bootstrap
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      needsRoleSelection,
      isBlocked,
      blockReason,
      roleOptions,
      locale,
      login,
      loginWithGoogle,
      selectRole,
      logout,
      refreshProfile,
      setLocale,
    }),
    [
      user,
      isBootstrapping,
      needsRoleSelection,
      isBlocked,
      blockReason,
      roleOptions,
      locale,
      login,
      loginWithGoogle,
      selectRole,
      logout,
      refreshProfile,
      setLocale,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
