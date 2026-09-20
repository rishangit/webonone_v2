import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme } from 'nativewind'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ThemeProvider,
  useColorMode,
  useMobileTheme,
  useThemeColors,
} from '@webonone/mobile-ui'
import {
  createPlatformDefaultThemeDto,
  deriveSemanticColors,
  themeDtoToColors,
  type ColorMode,
  type SemanticColors,
  type ThemeDto,
} from '@webonone/theme'
import { StatusBar } from 'expo-status-bar'
import { useSession } from '@/features/auth/SessionContext'
import { themeApi, type ApiTheme, type ThemePreferences } from '@/features/settings/system-theme/services/themeApi'

const STORAGE_KEY = 'webonone.mobile.theme'

type StoredTheme = {
  theme: ThemeDto
  colorMode: ColorMode
}

type AppThemeContextValue = {
  colorMode: ColorMode
  colors: SemanticColors
  applyPreferences: (preferences: ThemePreferences) => void
  refresh: () => Promise<void>
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null)

export function useAppTheme(): AppThemeContextValue {
  const value = useContext(AppThemeContext)
  if (!value) {
    throw new Error('useAppTheme must be used within AppThemeProvider')
  }
  return value
}

function toThemeDto(theme: ApiTheme | ThemeDto): ThemeDto {
  return {
    id: theme.id,
    name: theme.name,
    color1: theme.color1,
    color2: theme.color2,
    color3: theme.color3,
    color4: theme.color4,
    color5: theme.color5,
  }
}

function resolveColors(theme: ThemeDto, colorMode: ColorMode): SemanticColors {
  return deriveSemanticColors(themeDtoToColors(theme), colorMode)
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useSession()
  const [theme, setTheme] = useState<ThemeDto>(createPlatformDefaultThemeDto())
  const [colorMode, setColorMode] = useState<ColorMode>('light')

  const colors = useMemo(() => resolveColors(theme, colorMode), [theme, colorMode])

  const applyStored = useCallback((next: StoredTheme) => {
    setTheme(next.theme)
    setColorMode(next.colorMode)
    colorScheme.set(next.colorMode)
  }, [])

  const persist = useCallback(async (next: StoredTheme) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const applyPreferences = useCallback(
    (preferences: ThemePreferences) => {
      const next: StoredTheme = {
        theme: toThemeDto(preferences.theme),
        colorMode: preferences.colorMode,
      }
      applyStored(next)
      void persist(next)
    },
    [applyStored, persist],
  )

  const refresh = useCallback(async () => {
    const preferences = await themeApi.getPreferences()
    applyPreferences(preferences)
  }, [applyPreferences])

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const stored = JSON.parse(raw) as StoredTheme
        if (stored?.theme?.color1 && (stored.colorMode === 'light' || stored.colorMode === 'dark')) {
          applyStored(stored)
        }
      } catch {
        // Keep platform default.
      }
    })()
  }, [applyStored])

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return
    void refresh().catch(() => {
      // Cached/local theme still applies if the API is unavailable.
    })
  }, [isAuthenticated, isBootstrapping, refresh])

  const value = useMemo(
    () => ({ colorMode, colors, applyPreferences, refresh }),
    [colorMode, colors, applyPreferences, refresh],
  )

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider colors={colors} colorMode={colorMode}>
        <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  )
}

export { useColorMode, useMobileTheme, useThemeColors }
