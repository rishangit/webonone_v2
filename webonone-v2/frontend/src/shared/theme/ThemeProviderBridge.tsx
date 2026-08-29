import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react'
import {
  applyThemeVariables,
  applyUiTheme,
  broadcastListPageModeToIframes,
  broadcastThemeToIframes,
  broadcastUiThemeToIframes,
  buildThemePayload,
  createPlatformDefaultThemeDto,
  persistListPageMode,
  persistUiTheme,
  THEME_MESSAGE_TYPES,
} from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { systemThemeActions } from '@/features/settings/system-theme/store/systemThemeSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'

type ThemeBridgeContextValue = {
  broadcastToIframes: () => void
}

const ThemeBridgeContext = createContext<ThemeBridgeContextValue | null>(null)

export function useThemeBridge(): ThemeBridgeContextValue {
  const ctx = useContext(ThemeBridgeContext)
  if (!ctx) {
    return { broadcastToIframes: () => undefined }
  }
  return ctx
}

interface ThemeProviderBridgeProps {
  children: ReactNode
}

export function ThemeProviderBridge({ children }: ThemeProviderBridgeProps) {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const preferences = useAppSelector((s) => s.systemTheme.preferences)
  const preferencesFetchedAt = useAppSelector((s) => s.systemTheme.preferencesFetchedAt)

  useEffect(() => {
    if (accessToken && !isFresh(preferencesFetchedAt)) {
      dispatch(systemThemeActions.loadPreferencesRequested())
    }
  }, [accessToken, preferencesFetchedAt, dispatch])

  useEffect(() => {
    if (!preferences) return
    const payload = buildThemePayload(toThemeDto(preferences.theme), preferences.colorMode)
    applyThemeVariables(payload)
    persistListPageMode(preferences.listPageMode ?? 'pagination')
    const uiTheme = preferences.uiTheme ?? 'classic'
    persistUiTheme(uiTheme)
    applyUiTheme(uiTheme)
  }, [preferences])

  const broadcastToIframes = useCallback(() => {
    if (!preferences) return
    const payload = buildThemePayload(toThemeDto(preferences.theme), preferences.colorMode)
    const iframes = document.querySelectorAll('iframe')
    broadcastThemeToIframes(payload, iframes)
    persistListPageMode(preferences.listPageMode ?? 'pagination')
    broadcastListPageModeToIframes(preferences.listPageMode ?? 'pagination', iframes)
    const uiTheme = preferences.uiTheme ?? 'classic'
    persistUiTheme(uiTheme)
    broadcastUiThemeToIframes(uiTheme, iframes)
  }, [preferences])

  useEffect(() => {
    broadcastToIframes()
  }, [broadcastToIframes])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== THEME_MESSAGE_TYPES.READY) {
        return
      }

      const iframes = document.querySelectorAll('iframe')
      for (const iframe of iframes) {
        if (!iframe.src) {
          continue
        }
        try {
          if (new URL(iframe.src).origin === event.origin) {
            broadcastToIframes()
            return
          }
        } catch {
          // ignore invalid iframe src
        }
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [broadcastToIframes])

  return (
    <ThemeBridgeContext.Provider value={{ broadcastToIframes }}>{children}</ThemeBridgeContext.Provider>
  )
}

export function getGuestThemePayload() {
  return buildThemePayload(createPlatformDefaultThemeDto(), 'light')
}
