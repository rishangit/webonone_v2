import type { WebsiteTheme } from '../../types'

export type ThemeEditorTabProps = {
  theme: WebsiteTheme
  onPersist: (theme: WebsiteTheme) => void
  saving?: boolean
  fieldErrors?: Record<string, string>
}

export type ThemeBasicSettingsTabProps = {
  theme: WebsiteTheme
  onChange: (theme: WebsiteTheme) => void
  fieldErrors?: Record<string, string>
}

export const THEME_TOKEN_NONE = '__none'
