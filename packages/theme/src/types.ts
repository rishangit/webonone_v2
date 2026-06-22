export type ColorMode = 'light' | 'dark'

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
  version: 1
  theme: ThemeDto
  colorMode: ColorMode
}

export type ThemeApplyMessage = ThemePayload & {
  type: 'webonone:theme:apply'
}
