import type { WebsiteButtonLibraryItem, WebsiteTextLibraryItem } from '../types'
import type { FlattenedLibraryColor } from './colorLibraryPalette'
import {
  findColorOptionId,
  inferLibraryPaletteId,
  libraryPaletteIdFromOptionId,
  libraryPerColorPaletteUi,
} from './colorLibraryPalette'

type FontCatalogItem = {
  id: string
  family: string
  googleFontUrl?: string | null
}

export type ButtonLibraryFormSnapshot = {
  name: string
  publishStatus: 'draft' | 'published'
  fontId: string
  elementStyleColorPaletteId: string
  backgroundColorPaletteId: string
  backgroundColorId: string
  textColorPaletteId: string
  textColorId: string
  borderColorPaletteId: string
  borderColorId: string
  textSize: number
  borderWidth: number
  radius: number
}

export type TextLibraryFormSnapshot = {
  name: string
  publishStatus: 'draft' | 'published'
  fontId: string
  elementStyleColorPaletteId: string
  fontColorPaletteId: string
  colorOptionId: string
  size: number
}

export function buildButtonLibraryFormFromItem(
  item: WebsiteButtonLibraryItem,
  fonts: FontCatalogItem[],
  colorLibraryItems: Array<{ id: string }>,
  colorOptions: FlattenedLibraryColor[],
): ButtonLibraryFormSnapshot | null {
  if (colorOptions.length === 0) return null
  const d = item.definition
  const font =
    fonts.find(
      (entry) => entry.googleFontUrl === d.textGoogleFontUrl || entry.family === d.textFontFamily,
    ) ?? null
  const backgroundColorId = findColorOptionId(d.backgroundColorValue, colorOptions)
  const textColorId =
    findColorOptionId(d.labelColorValue, colorOptions) ||
    findColorOptionId(d.textColorValue, colorOptions)
  const borderColorId = findColorOptionId(d.borderColorValue, colorOptions)
  if (!backgroundColorId || !textColorId || !borderColorId) return null

  const defaultPalette = colorLibraryItems[0]?.id ?? ''
  const elementPalette = inferLibraryPaletteId(colorOptions, [
    backgroundColorId,
    textColorId,
    borderColorId,
  ])
  const elementStyleColorPaletteId = libraryPerColorPaletteUi(elementPalette, '', defaultPalette)
  const styleEffective = elementStyleColorPaletteId.trim() || elementPalette || defaultPalette

  return {
    name: item.name,
    publishStatus: item.publishStatus ?? 'draft',
    fontId: font?.id ?? '',
    elementStyleColorPaletteId,
    backgroundColorPaletteId: libraryPerColorPaletteUi(
      libraryPaletteIdFromOptionId(colorOptions, backgroundColorId),
      styleEffective,
      defaultPalette,
    ),
    backgroundColorId,
    textColorPaletteId: libraryPerColorPaletteUi(
      libraryPaletteIdFromOptionId(colorOptions, textColorId),
      styleEffective,
      defaultPalette,
    ),
    textColorId,
    borderColorPaletteId: libraryPerColorPaletteUi(
      libraryPaletteIdFromOptionId(colorOptions, borderColorId),
      styleEffective,
      defaultPalette,
    ),
    borderColorId,
    textSize: d.textSize,
    borderWidth: d.borderWidth,
    radius: d.radius,
  }
}

export function buildTextLibraryFormFromItem(
  item: WebsiteTextLibraryItem,
  fonts: FontCatalogItem[],
  colorLibraryItems: Array<{ id: string }>,
  colorOptions: FlattenedLibraryColor[],
): TextLibraryFormSnapshot | null {
  if (colorOptions.length === 0) return null
  const d = item.definition
  const font =
    fonts.find((entry) => entry.googleFontUrl === d.googleFontUrl || entry.family === d.family) ??
    null
  const colorOptionId = findColorOptionId(d.colorValue, colorOptions)
  if (!colorOptionId) return null

  const defaultPalette = colorLibraryItems[0]?.id ?? ''
  const elementPalette = inferLibraryPaletteId(colorOptions, [colorOptionId])
  const elementStyleColorPaletteId = libraryPerColorPaletteUi(elementPalette, '', defaultPalette)
  const styleEffective = elementStyleColorPaletteId.trim() || elementPalette || defaultPalette

  return {
    name: item.name,
    publishStatus: item.publishStatus ?? 'draft',
    fontId: font?.id ?? '',
    elementStyleColorPaletteId,
    fontColorPaletteId: libraryPerColorPaletteUi(
      libraryPaletteIdFromOptionId(colorOptions, colorOptionId),
      styleEffective,
      defaultPalette,
    ),
    colorOptionId,
    size: d.size,
  }
}

export function isButtonLibraryFormHydrated(snapshot: {
  backgroundColorId: string
  textColorId: string
  borderColorId: string
}): boolean {
  return Boolean(snapshot.backgroundColorId && snapshot.textColorId && snapshot.borderColorId)
}

export function isTextLibraryFormHydrated(snapshot: { colorOptionId: string }): boolean {
  return Boolean(snapshot.colorOptionId)
}
