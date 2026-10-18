import { nanoid } from 'nanoid'
import type {
  WebsiteButtonLibraryItem,
  WebsiteButtonStyle,
  WebsiteColorToken,
  WebsiteElementCustomization,
  WebsiteFontToken,
  WebsiteTextLibraryItem,
  WebsiteTextStyle,
  WebsiteTheme,
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
  colors?: WebsiteColorToken[]
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
): { theme: WebsiteTheme; color: WebsiteColorToken; created: boolean } {
  const normalized = normalizeColorValue(spec.value)
  const existing = theme.colors.find((color) => normalizeColorValue(color.value) === normalized)
  if (existing) return { theme, color: existing, created: false }
  const color: WebsiteColorToken = {
    id: nanoid(8),
    name: spec.name,
    value: spec.value.trim(),
  }
  return { theme: { ...theme, colors: [...theme.colors, color] }, color, created: true }
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
  if (colorResult.created) patch.colors = [...(patch.colors ?? []), colorResult.color]

  const textStyle: WebsiteTextStyle = {
    id: textId,
    name: item.name,
    fontId: fontResult.font.id,
    colorId: colorResult.color.id,
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
  if (labelColorResult.created) patch.colors = [...(patch.colors ?? []), labelColorResult.color]

  const textStyle: WebsiteTextStyle = {
    id: options.keepTextStyleId ?? nanoid(8),
    name: d.textStyleName,
    fontId: fontResult.font.id,
    colorId: labelColorResult.color.id,
    size: d.textSize,
  }
  patch.textStyles = [textStyle]
  next = { ...next, textStyles: upsertById(next.textStyles, textStyle) }

  const bgResult = upsertColorOnTheme(next, { name: d.backgroundColorName, value: d.backgroundColorValue })
  next = bgResult.theme
  if (bgResult.created) patch.colors = [...(patch.colors ?? []), bgResult.color]

  const textColorResult = upsertColorOnTheme(next, { name: d.textColorName, value: d.textColorValue })
  next = textColorResult.theme
  if (textColorResult.created) patch.colors = [...(patch.colors ?? []), textColorResult.color]

  const borderResult = upsertColorOnTheme(next, { name: d.borderColorName, value: d.borderColorValue })
  if (borderResult.created) patch.colors = [...(patch.colors ?? []), borderResult.color]

  const buttonStyle: WebsiteButtonStyle = {
    id: buttonId,
    name: item.name,
    backgroundColorId: bgResult.color.id,
    textColorId: textColorResult.color.id,
    textStyleId: textStyle.id,
    borderColorId: borderResult.color.id,
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
  if (patch.colors?.length) {
    for (const color of patch.colors) {
      next = { ...next, colors: upsertById(next.colors, color) }
    }
  }
  if (patch.textStyles?.length) {
    for (const style of patch.textStyles) {
      next = { ...next, textStyles: upsertById(next.textStyles, style) }
    }
  }
  return next
}
