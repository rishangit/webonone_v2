export type ColorMode = 'light' | 'dark'

/** Five user-configurable base colors (semantic names). */
export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
}

/** Full derived palette for a single color mode. */
export interface SemanticColors {
  primary: string
  primaryHover: string
  primaryActive: string
  primaryLight: string
  primaryText: string

  secondary: string
  secondaryHover: string
  secondaryActive: string
  secondaryLight: string
  secondaryText: string

  background: string
  surface: string
  surfaceHover: string
  surfaceActive: string
  surfaceSelected: string

  text: string
  textTitle: string
  textDescription: string
  textLabel: string
  textSecondary: string
  textMuted: string
  textDisabled: string

  border: string
  borderLight: string
  borderStrong: string
  borderHover: string
  borderFocus: string
  divider: string

  focus: string
  selection: string

  success: string
  successBackground: string
  successBorder: string

  warning: string
  warningBackground: string
  warningBorder: string

  error: string
  errorBackground: string
  errorBorder: string

  info: string
  infoBackground: string
  infoBorder: string
}

/**
 * Storage DTO — DB columns color1–color5 alias semantic slots:
 * color1=primary, color2=secondary, color3=text, color4=background, color5=surface
 */
export type ThemeDto = {
  id: string
  name: string
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
}

export type ThemePayload = {
  version: 1 | 2
  theme: ThemeDto
  colorMode: ColorMode
}

export type ThemeApplyMessage = ThemePayload & {
  type: 'webonone:theme:apply'
}
