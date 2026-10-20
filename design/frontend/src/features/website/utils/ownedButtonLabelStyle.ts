import { nanoid } from 'nanoid'
import type { WebsiteButtonStyle, WebsiteTextStyle, WebsiteTheme } from '../types'
import { emptyWebsiteElementCustomization, normalizeWebsiteElementCustomization } from './websiteElementCustomization'

export function emptyOwnedLabelStyle(
  theme: WebsiteTheme,
  name: string,
  existing?: WebsiteTextStyle | null,
): WebsiteTextStyle {
  return {
    id: nanoid(8),
    name: name.trim() || 'Button',
    fontId: existing?.fontId || theme.fonts[0]?.id || '',
    colorIndex: existing?.colorIndex || Math.min(2, theme.colorPalettes?.[0]?.colors.length || 1),
    colorPaletteId: existing?.colorPaletteId ?? null,
    size: existing?.size ?? 18,
    sizeByBreakpoint: existing?.sizeByBreakpoint,
  }
}

export function resolveOwnedButtonLabelStyle(
  theme: WebsiteTheme,
  button: WebsiteButtonStyle,
): WebsiteTextStyle {
  const existing = theme.textStyles.find((item) => item.id === button.textStyleId) ?? null
  const shared =
    existing != null &&
    theme.buttonStyles.some((item) => item.id !== button.id && item.textStyleId === existing.id)
  if (existing && !shared) return { ...existing }
  return emptyOwnedLabelStyle(theme, button.name, existing)
}

export function emptyButtonDraft(
  theme: WebsiteTheme,
  initial?: WebsiteButtonStyle,
): { button: WebsiteButtonStyle; labelStyle: WebsiteTextStyle } {
  if (initial) {
    const labelStyle = resolveOwnedButtonLabelStyle(theme, initial)
    const textColorIndex = labelStyle.colorIndex || initial.textColorIndex
    return {
      button: {
        ...initial,
        textColorIndex,
        textStyleId: labelStyle.id,
        customization: normalizeWebsiteElementCustomization(initial.customization),
      },
      labelStyle: { ...labelStyle, colorIndex: textColorIndex, colorPaletteId: initial.colorPaletteId ?? null },
    }
  }

  const buttonId = nanoid(8)
  const labelStyle = emptyOwnedLabelStyle(theme, '')
  return {
    button: {
      id: buttonId,
      name: '',
      colorPaletteId: null,
      backgroundColorIndex: 1,
      textColorIndex: labelStyle.colorIndex,
      textStyleId: labelStyle.id,
      borderColorIndex: 1,
      borderWidth: 0,
      radius: 6,
      customization: emptyWebsiteElementCustomization(),
    },
    labelStyle,
  }
}

export function applyButtonBasicToDraft(
  button: WebsiteButtonStyle,
  labelStyle: WebsiteTextStyle,
  next: {
    name: string
    fontId: string
    colorPaletteId: string | null
    backgroundColorIndex: number
    textColorIndex: number
    borderColorIndex: number
    textSize: number
    borderWidth: number
    radius: number
  },
): { button: WebsiteButtonStyle; labelStyle: WebsiteTextStyle } {
  const name = next.name
  return {
    button: {
      ...button,
      name,
      colorPaletteId: next.colorPaletteId,
      backgroundColorIndex: next.backgroundColorIndex,
      textColorIndex: next.textColorIndex,
      borderColorIndex: next.borderColorIndex,
      borderWidth: next.borderWidth,
      radius: next.radius,
      textStyleId: labelStyle.id,
    },
    labelStyle: {
      ...labelStyle,
      name: name.trim() || labelStyle.name,
      fontId: next.fontId,
      colorPaletteId: next.colorPaletteId,
      colorIndex: next.textColorIndex,
      size: next.textSize,
    },
  }
}
