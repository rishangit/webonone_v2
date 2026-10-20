import { nanoid } from 'nanoid'
import type {
  WebsiteButtonLibraryItem,
  WebsiteButtonStyle,
  WebsiteElementCustomization,
  WebsiteFontToken,
  WebsiteTextLibraryItem,
  WebsiteTextStyle,
  WebsiteTheme,
  WebsiteThemeColorPalette,
} from '../types'
import { upsertById } from './upsertById'

export type MaterializeButtonLibraryOptions = {
  keepId?: string
  keepTextStyleId?: string
}

export type MaterializeTextLibraryOptions = {
  keepId?: string
}

function remapElementScope(
  customization: WebsiteElementCustomization | undefined,
  fromId: string,
  toId: string,
): WebsiteElementCustomization | undefined {
  if (!customization || fromId === toId) return customization
  const fromClass = `website-el-${fromId}`
  const toClass = `website-el-${toId}`
  return {
    html: customization.html?.split(fromClass).join(toClass) ?? '',
    styles: customization.styles?.split(fromClass).join(toClass) ?? '',
    scripts: customization.scripts?.split(fromClass).join(toClass) ?? '',
  }
}

export type ThemeTokenPatch = {
  fonts?: WebsiteFontToken[]
  colorPalettes?: WebsiteThemeColorPalette[]
  textStyles?: WebsiteTextStyle[]
}

function normalizeColorValue(value: string): string {
  return value.trim().toLowerCase()
}

function upsertFontOnTheme(
  theme: WebsiteTheme,
  spec: { name: string; googleFontUrl: string; family: string },
): { theme: WebsiteTheme; font: WebsiteFontToken; created: boolean } {
  const existing = theme.fonts.find(
    (font) => font.googleFontUrl === spec.googleFontUrl || font.family === spec.family,
  )
  if (existing) return { theme, font: existing, created: false }
  const font: WebsiteFontToken = {
    id: nanoid(8),
    name: spec.name,
    googleFontUrl: spec.googleFontUrl,
    family: spec.family,
  }
  return { theme: { ...theme, fonts: [...theme.fonts, font] }, font, created: true }
}

function upsertColorOnTheme(
  theme: WebsiteTheme,
  spec: { name: string; value: string },
): { theme: WebsiteTheme; index: number; palette: WebsiteThemeColorPalette | null; created: boolean } {
  const normalized = normalizeColorValue(spec.value)
  const paletteId = theme.colorPaletteId || theme.colorPalettes[0]?.id
  const current = theme.colorPalettes.find((palette) => palette.id === paletteId) ?? theme.colorPalettes[0]
  if (!current) {
    const palette: WebsiteThemeColorPalette = {
      id: nanoid(8),
      name: 'Palette',
      sourceLibraryPaletteId: null,
      colors: [{ name: spec.name, value: spec.value.trim() }],
    }
    return {
      theme: { ...theme, colorPaletteId: palette.id, colorPalettes: [palette] },
      index: 1,
      palette,
      created: true,
    }
  }
  const existingIndex = current.colors.findIndex((color) => normalizeColorValue(color.value) === normalized)
  if (existingIndex >= 0) return { theme, index: existingIndex + 1, palette: null, created: false }
  if (current.colors.length >= 6) return { theme, index: 1, palette: null, created: false }
  const palette: WebsiteThemeColorPalette = {
    ...current,
    colors: [...current.colors, { name: spec.name, value: spec.value.trim() }],
  }
  return {
    theme: {
      ...theme,
      colorPaletteId: theme.colorPaletteId || palette.id,
      colorPalettes: theme.colorPalettes.map((item) => (item.id === palette.id ? palette : item)),
    },
    index: palette.colors.length,
    palette,
    created: true,
  }
}

export function materializeTextLibraryItem(
  theme: WebsiteTheme,
  item: WebsiteTextLibraryItem,
  options: MaterializeTextLibraryOptions = {},
): { textStyle: WebsiteTextStyle; patch: ThemeTokenPatch } {
  const d = item.definition
  const patch: ThemeTokenPatch = {}
  let next = theme
  const textId = options.keepId ?? nanoid(8)

  const fontResult = upsertFontOnTheme(next, {
    name: d.fontName,
    googleFontUrl: d.googleFontUrl,
    family: d.family,
  })
  next = fontResult.theme
  if (fontResult.created) patch.fonts = [fontResult.font]

  const colorResult = upsertColorOnTheme(next, { name: d.colorName, value: d.colorValue })
  next = colorResult.theme
  if (colorResult.palette) patch.colorPalettes = [colorResult.palette]

  const textStyle: WebsiteTextStyle = {
    id: textId,
    name: item.name,
    fontId: fontResult.font.id,
    colorIndex: colorResult.index,
    colorPaletteId: null,
    size: d.size,
    sizeByBreakpoint: d.sizeByBreakpoint,
    sourceLibraryId: item.id,
    customization: remapElementScope(d.customization, item.id, textId),
  }

  return { textStyle, patch }
}

export function materializeButtonLibraryItem(
  theme: WebsiteTheme,
  item: WebsiteButtonLibraryItem,
  options: MaterializeButtonLibraryOptions = {},
): { buttonStyle: WebsiteButtonStyle; patch: ThemeTokenPatch } {
  const d = item.definition
  const patch: ThemeTokenPatch = {}
  let next = theme
  const buttonId = options.keepId ?? nanoid(8)

  const fontResult = upsertFontOnTheme(next, {
    name: d.textFontName,
    googleFontUrl: d.textGoogleFontUrl,
    family: d.textFontFamily,
  })
  next = fontResult.theme
  if (fontResult.created) patch.fonts = [fontResult.font]

  const labelColorResult = upsertColorOnTheme(next, { name: d.labelColorName, value: d.labelColorValue })
  next = labelColorResult.theme
  if (labelColorResult.palette) patch.colorPalettes = [labelColorResult.palette]

  const textStyle: WebsiteTextStyle = {
    id: options.keepTextStyleId ?? nanoid(8),
    name: d.textStyleName,
    fontId: fontResult.font.id,
    colorIndex: labelColorResult.index,
    colorPaletteId: null,
    size: d.textSize,
  }
  patch.textStyles = [textStyle]
  next = { ...next, textStyles: upsertById(next.textStyles, textStyle) }

  const bgResult = upsertColorOnTheme(next, { name: d.backgroundColorName, value: d.backgroundColorValue })
  next = bgResult.theme
  if (bgResult.palette) patch.colorPalettes = [bgResult.palette]

  const textColorResult = upsertColorOnTheme(next, { name: d.textColorName, value: d.textColorValue })
  next = textColorResult.theme
  if (textColorResult.palette) patch.colorPalettes = [textColorResult.palette]

  const borderResult = upsertColorOnTheme(next, { name: d.borderColorName, value: d.borderColorValue })
  if (borderResult.palette) patch.colorPalettes = [borderResult.palette]

  const buttonStyle: WebsiteButtonStyle = {
    id: buttonId,
    name: item.name,
    colorPaletteId: null,
    backgroundColorIndex: bgResult.index,
    textColorIndex: textColorResult.index,
    textStyleId: textStyle.id,
    borderColorIndex: borderResult.index,
    borderWidth: d.borderWidth,
    radius: d.radius,
    sourceLibraryId: item.id,
    customization: remapElementScope(d.customization, item.id, buttonId),
  }

  return { buttonStyle, patch }
}

export function applyThemeTokenPatch(theme: WebsiteTheme, patch?: ThemeTokenPatch): WebsiteTheme {
  if (!patch) return theme
  let next = theme
  if (patch.fonts?.length) {
    for (const font of patch.fonts) {
      next = { ...next, fonts: upsertById(next.fonts, font) }
    }
  }
  if (patch.colorPalettes?.length) {
    for (const palette of patch.colorPalettes) {
      next = { ...next, colorPalettes: upsertById(next.colorPalettes, palette) }
    }
  }
  if (patch.textStyles?.length) {
    for (const style of patch.textStyles) {
      next = { ...next, textStyles: upsertById(next.textStyles, style) }
    }
  }
  return next
}
