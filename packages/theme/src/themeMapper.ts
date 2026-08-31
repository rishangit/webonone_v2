import type { ThemeColors, ThemeDto } from './types'

/** Map storage DTO columns to semantic theme colors. */
export function themeDtoToColors(dto: Pick<ThemeDto, 'color1' | 'color2' | 'color3' | 'color4' | 'color5'>): ThemeColors {
  return {
    primary: dto.color1,
    secondary: dto.color2,
    background: dto.color4,
    surface: dto.color5,
    text: dto.color3,
  }
}

/** Map semantic theme colors to storage DTO columns. */
export function colorsToThemeDto(
  colors: ThemeColors,
  meta: Pick<ThemeDto, 'id' | 'name'>,
): ThemeDto {
  return {
    id: meta.id,
    name: meta.name,
    color1: colors.primary,
    color2: colors.secondary,
    color3: colors.text,
    color4: colors.background,
    color5: colors.surface,
  }
}

/** v2 URL order: primary, secondary, background, surface, text */
export function themeColorsToUrlSlots(colors: ThemeColors): [string, string, string, string, string] {
  return [colors.primary, colors.secondary, colors.background, colors.surface, colors.text]
}

/** Parse v2 URL slots into ThemeDto column order. */
export function urlSlotsToThemeDto(
  slots: [string, string, string, string, string],
  meta: Pick<ThemeDto, 'id' | 'name'>,
): ThemeDto {
  const [primary, secondary, background, surface, text] = slots
  return colorsToThemeDto({ primary, secondary, background, surface, text }, meta)
}

/** v1 URL order: color1, color2, color3, color4, color5 (legacy direct column order). */
export function v1UrlSlotsToThemeDto(
  slots: [string, string, string, string, string],
  meta: Pick<ThemeDto, 'id' | 'name'>,
): ThemeDto {
  const [color1, color2, color3, color4, color5] = slots
  return { id: meta.id, name: meta.name, color1, color2, color3, color4, color5 }
}
