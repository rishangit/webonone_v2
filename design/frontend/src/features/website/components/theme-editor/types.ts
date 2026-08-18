import type { WebsiteTheme } from '../../types'

export type ThemeEditorTabProps = {
  theme: WebsiteTheme
  onChange: (theme: WebsiteTheme) => void
  fieldErrors?: Record<string, string>
}

export const THEME_TOKEN_NONE = '__none'
