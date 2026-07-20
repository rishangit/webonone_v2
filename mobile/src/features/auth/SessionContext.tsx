import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from './authApi'
import { setUnauthorizedHandler } from '@/shared/services/apiClient'
import { secureStorage } from '@/shared/services/secureStorage'
import type { UserProfile } from '@/shared/types'

interface SessionContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isBootstrapping, setBootstrapping] = useState(true)

  const logout = useCallback(async () => {
    await secureStorage.clearAccessToken()
    await secureStorage.clearDevice()
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchProfile()
    setUser(profile)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await authApi.login(email, password)
      await secureStorage.setAccessToken(accessToken)
      await refreshProfile()
    },
    [refreshProfile],
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
          const profile = await authApi.fetchProfile()
          if (active) setUser(profile)
        } catch {
          await secureStorage.clearAccessToken()
        }
      }
      if (active) setBootstrapping(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login,
      logout,
      refreshProfile,
    }),
    [user, isBootstrapping, login, logout, refreshProfile],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
