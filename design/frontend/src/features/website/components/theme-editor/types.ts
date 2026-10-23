import type { WebsiteTheme } from '../../types'

export type ThemeEditorTabProps = {
  theme: WebsiteTheme
  onPersist: (theme: WebsiteTheme) => boolean | void
  saving?: boolean
  fieldErrors?: Record<string, string>
}

export type ThemeBasicSettingsTabProps = {
  theme: WebsiteTheme
  onPersist: (theme: WebsiteTheme) => boolean | void
  fieldErrors?: Record<string, string>
  canManage?: boolean
  saving?: boolean
}

export const THEME_TOKEN_NONE = '__none'
