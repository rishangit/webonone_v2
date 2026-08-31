import { colorsToThemeDto, themeDtoToColors, type ThemeColors, type ThemeDto } from '@webonone/theme'

export type ThemeFormColors = ThemeColors & { name: string }

/** Map API/storage theme to form values with semantic color keys. */
export function themeFormFromDto(dto: Pick<ThemeDto, 'name' | 'color1' | 'color2' | 'color3' | 'color4' | 'color5'>): ThemeFormColors {
  const colors = themeDtoToColors(dto)
  return {
    name: dto.name,
    ...colors,
  }
}

/** Map form values to API create/update body (storage column names). */
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

/** Map form colors to ThemeDto for live preview. */
export function themeFormToPreviewDto(values: ThemeFormColors, id = 'preview'): ThemeDto {
  return colorsToThemeDto(
    {
      primary: values.primary,
      secondary: values.secondary,
      background: values.background,
      surface: values.surface,
      text: values.text,
    },
    { id, name: values.name },
  )
}
