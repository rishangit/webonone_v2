import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from './authApi'
import { getGoogleIdToken, GoogleSignInCancelledError } from './googleSignIn'
import {
  findMatchingGatewayRole,
  sessionRoleApi,
  type GatewayRoleOption,
} from './sessionRoleApi'
import { setUnauthorizedHandler } from '@/shared/services/apiClient'
import { secureStorage } from '@/shared/services/secureStorage'
import type { UserProfile } from '@/shared/types'

interface SessionContextValue {
  user: UserProfile | null
  /** JWT reissued + SMS /me with Super Admin or Company Owner scope. */
  isAuthenticated: boolean
  isBootstrapping: boolean
  /** Has token and gateway role options; waiting for user to Continue. */
  needsRoleSelection: boolean
  /** Signed in but not Super Admin / Company Owner. */
  isBlocked: boolean
  /** Message when isBlocked (or role resolve failure). */
  blockReason: string | null
  /** Filtered Super Admin / Company Owner options for the select-role screen. */
  roleOptions: GatewayRoleOption[]
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  selectRole: (option: GatewayRoleOption) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

const NO_GATEWAY_ROLES =
  'SMS gateway setup is only available for Super Admins and Company Owners.'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isBootstrapping, setBootstrapping] = useState(true)
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false)
  const [isBlocked, setBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  const [roleOptions, setRoleOptions] = useState<GatewayRoleOption[]>([])

  const clearSessionState = useCallback(() => {
    setUser(null)
    setNeedsRoleSelection(false)
    setBlocked(false)
    setBlockReason(null)
    setRoleOptions([])
  }, [])

  const logout = useCallback(async () => {
    await secureStorage.clearAccessToken()
    await secureStorage.clearSessionRole()
    await secureStorage.clearDevice()
    clearSessionState()
  }, [clearSessionState])

  const applyGatewayRole = useCallback(async (option: GatewayRoleOption, accessToken: string) => {
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
    })

    const profile = await authApi.fetchProfile(option.companyName)
    if (!profile.scope || (profile.role !== 'super_admin' && profile.role !== 'company_admin')) {
      setUser(null)
      setNeedsRoleSelection(false)
      setRoleOptions([])
      setBlocked(true)
      setBlockReason(NO_GATEWAY_ROLES)
      return
    }

    setUser(profile)
    setNeedsRoleSelection(false)
    setBlocked(false)
    setBlockReason(null)
    setRoleOptions([])
  }, [])

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
        setBlockReason(NO_GATEWAY_ROLES)
        return
      }

      if (opts?.preferSticky) {
        const sticky = await secureStorage.getSessionRole()
        if (sticky) {
          const match = findMatchingGatewayRole(options, sticky.role, sticky.companyId)
          if (match) {
            await applyGatewayRole(match, accessToken)
            return
          }
          await secureStorage.clearSessionRole()
        }
      }

      if (options.length === 1) {
        await applyGatewayRole(options[0], accessToken)
        return
      }

      setUser(null)
      setBlocked(false)
      setBlockReason(null)
      setNeedsRoleSelection(true)
    },
    [applyGatewayRole],
  )

  const refreshProfile = useCallback(async () => {
    const sticky = await secureStorage.getSessionRole()
    const profile = await authApi.fetchProfile(sticky?.companyName ?? null)
    if (!profile.scope || (profile.role !== 'super_admin' && profile.role !== 'company_admin')) {
      setUser(null)
      setBlocked(true)
      setBlockReason(NO_GATEWAY_ROLES)
      setNeedsRoleSelection(false)
      return
    }
    setUser(profile)
    setBlocked(false)
    setBlockReason(null)
    setNeedsRoleSelection(false)
  }, [])

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
    async (option: GatewayRoleOption) => {
      const token = await secureStorage.getAccessToken()
      if (!token) {
        throw new Error('Session expired. Please sign in again.')
      }
      await applyGatewayRole(option, token)
    },
    [applyGatewayRole],
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
      isAuthenticated: user !== null && user.scope !== null,
      isBootstrapping,
      needsRoleSelection,
      isBlocked,
      blockReason,
      roleOptions,
      login,
      loginWithGoogle,
      selectRole,
      logout,
      refreshProfile,
    }),
    [
      user,
      isBootstrapping,
      needsRoleSelection,
      isBlocked,
      blockReason,
      roleOptions,
      login,
      loginWithGoogle,
      selectRole,
      logout,
      refreshProfile,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
