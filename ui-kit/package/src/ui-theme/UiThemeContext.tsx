import { createContext, useContext, type ReactNode } from 'react'
import { DEFAULT_UI_THEME, type UiThemeId } from './uiTheme'

const UiThemeContext = createContext<UiThemeId>(DEFAULT_UI_THEME)

export function UiThemeProvider({
  theme = DEFAULT_UI_THEME,
  children,
}: {
  theme?: UiThemeId
  children: ReactNode
}) {
  return <UiThemeContext.Provider value={theme}>{children}</UiThemeContext.Provider>
}

export function useUiTheme(): UiThemeId {
  return useContext(UiThemeContext)
}
