import { colorsToThemeDto, themeDtoToColors, type ThemeColors, type ThemeDto } from '@webonone/theme'
import type { ApiTheme } from '@/features/settings/system-theme/services/themeApi'

export type ThemeFormColors = ThemeColors & { name: string }

export function themeFormFromDto(
  dto: Pick<ThemeDto, 'name' | 'color1' | 'color2' | 'color3' | 'color4' | 'color5'>,
): ThemeFormColors {
  const colors = themeDtoToColors(dto)
  return {
    name: dto.name,
    ...colors,
  }
}

export function themeFormFromApiTheme(theme: ApiTheme): ThemeFormColors {
  return themeFormFromDto(theme)
}

export function themeFormToApiBody(values: ThemeFormColors): {
  name: string
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
} {
  const dto = colorsToThemeDto(
    {
      primary: values.primary,
      secondary: values.secondary,
      background: values.background,
      surface: values.surface,
      text: values.text,
    },
    { id: 'form', name: values.name },
  )
  return {
    name: dto.name,
    color1: dto.color1,
    color2: dto.color2,
    color3: dto.color3,
    color4: dto.color4,
    color5: dto.color5,
  }
}
