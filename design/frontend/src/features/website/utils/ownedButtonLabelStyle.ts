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
    colorId:
      existing?.colorId ||
      theme.colorPalettes?.[0]?.colorIds[1] ||
      theme.colorPalettes?.[0]?.colorIds[0] ||
      theme.colors[1]?.id ||
      theme.colors[0]?.id ||
      '',
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
    const textColorId = labelStyle.colorId || initial.textColorId
    return {
      button: {
        ...initial,
        textColorId,
        textStyleId: labelStyle.id,
        customization: normalizeWebsiteElementCustomization(initial.customization),
      },
      labelStyle: { ...labelStyle, colorId: textColorId },
    }
  }

  const buttonId = nanoid(8)
  const labelStyle = emptyOwnedLabelStyle(theme, '')
  return {
    button: {
      id: buttonId,
      name: '',
      backgroundColorId: theme.colorPalettes?.[0]?.colorIds[0] ?? theme.colors[0]?.id ?? '',
      textColorId:
        theme.colorPalettes?.[0]?.colorIds[1] ??
        theme.colorPalettes?.[0]?.colorIds[0] ??
        theme.colors[1]?.id ??
        theme.colors[0]?.id ??
        '',
      textStyleId: labelStyle.id,
      borderColorId: theme.colorPalettes?.[0]?.colorIds[0] ?? theme.colors[0]?.id ?? '',
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
    backgroundColorId: string
    textColorId: string
    borderColorId: string
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
      backgroundColorId: next.backgroundColorId,
      textColorId: next.textColorId,
      borderColorId: next.borderColorId,
      borderWidth: next.borderWidth,
      radius: next.radius,
      textStyleId: labelStyle.id,
    },
    labelStyle: {
      ...labelStyle,
      name: name.trim() || labelStyle.name,
      fontId: next.fontId,
      colorId: next.textColorId,
      size: next.textSize,
    },
  }
}
