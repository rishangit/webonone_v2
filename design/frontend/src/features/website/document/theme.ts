import type {
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteButtonStyle,
  WebsiteColorToken,
  WebsiteDocumentV1,
  WebsiteTextStyle,
  WebsiteTheme,
} from '../types'

function colorValue(colors: WebsiteColorToken[], id: string, fallback: string): string {
  return colors.find((color) => color.id === id)?.value ?? fallback
}

export function fallbackTextSize(sizeByBreakpoint?: WebsiteTextStyle['sizeByBreakpoint']): number {
  return (
    sizeByBreakpoint?.md ??
    sizeByBreakpoint?.lg ??
    sizeByBreakpoint?.sm ??
    sizeByBreakpoint?.xl ??
    sizeByBreakpoint?.['2xl'] ??
    16
  )
}

export function resolveFontSize(style: WebsiteTextStyle | undefined, breakpoint?: WebsiteBreakpoint): number {
  if (!style) return 16
  if (breakpoint != null && style.sizeByBreakpoint?.[breakpoint] != null) {
    return style.sizeByBreakpoint[breakpoint] as number
  }
  return style.size ?? 16
}

export function textStyleSnapshot(
  theme: WebsiteTheme | null,
  style: WebsiteTextStyle | undefined,
  breakpoint?: WebsiteBreakpoint,
) {
  const font = theme?.fonts.find((item) => item.id === style?.fontId)
  return {
    fontFamily: font?.family ?? 'inherit',
    googleFontUrl: font?.googleFontUrl || undefined,
    size: resolveFontSize(style, breakpoint),
    color: colorValue(theme?.colors ?? [], style?.colorId ?? '', theme?.bodyTextColor ?? '#111827'),
  }
}

export function resolveTextStyle(
  theme: WebsiteTheme | null,
  style: WebsiteTextStyle | undefined,
  breakpoint?: WebsiteBreakpoint,
) {
  return textStyleSnapshot(theme, style, breakpoint)
}

export function resolveButtonStyle(theme: WebsiteTheme | null, style: WebsiteButtonStyle | undefined) {
  const labelStyle = theme?.textStyles.find((item) => item.id === style?.textStyleId)
  const labelSnap = textStyleSnapshot(theme, labelStyle)
  return {
    background: colorValue(theme?.colors ?? [], style?.backgroundColorId ?? '', '#111827'),
    textColor: colorValue(theme?.colors ?? [], style?.textColorId ?? '', '#ffffff'),
    borderColor: colorValue(theme?.colors ?? [], style?.borderColorId ?? '', 'transparent'),
    borderWidth: style?.borderWidth ?? 0,
    radius: style?.radius ?? 6,
    fontFamily: labelSnap.fontFamily,
    googleFontUrl: labelSnap.googleFontUrl,
    fontSize: labelSnap.size,
  }
}

export function snapshotDocument(document: WebsiteDocumentV1, theme: WebsiteTheme | null): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: document.blocks.map((block) => ({
      ...block,
      addons: block.addons.map((addon) => snapshotAddon(addon, theme)),
    })),
  }
}

function snapshotAddon(addon: WebsiteAddon, theme: WebsiteTheme | null): WebsiteAddon {
  if (addon.type === 'text') {
    const style = theme?.textStyles.find((item) => item.id === addon.props.textStyleId)
    return { ...addon, props: { ...addon.props, snapshot: textStyleSnapshot(theme, style) } }
  }
  if (addon.type === 'button') {
    const button = theme?.buttonStyles.find((item) => item.id === addon.props.buttonStyleId)
    const labelStyle = theme?.textStyles.find((item) => item.id === button?.textStyleId)
    const labelSnap = textStyleSnapshot(theme, labelStyle)
    return {
      ...addon,
      props: {
        ...addon.props,
        snapshot: {
          background: colorValue(theme?.colors ?? [], button?.backgroundColorId ?? '', '#111827'),
          textColor: colorValue(theme?.colors ?? [], button?.textColorId ?? '', '#ffffff'),
          borderColor: colorValue(theme?.colors ?? [], button?.borderColorId ?? '', 'transparent'),
          borderWidth: button?.borderWidth ?? 0,
          radius: button?.radius ?? 6,
          fontFamily: labelSnap.fontFamily,
          googleFontUrl: labelSnap.googleFontUrl,
          fontSize: labelSnap.size,
        },
      },
    }
  }
  return addon
}

export function collectGoogleFontUrls(theme: WebsiteTheme | null, document?: WebsiteDocumentV1): string[] {
  const urls = new Set<string>()
  for (const font of theme?.fonts ?? []) {
    if (font.googleFontUrl) urls.add(font.googleFontUrl)
  }
  for (const block of document?.blocks ?? []) {
    for (const addon of block.addons) {
      if (addon.type === 'text' && addon.props.snapshot.googleFontUrl) {
        urls.add(addon.props.snapshot.googleFontUrl)
      }
      if (addon.type === 'button' && addon.props.snapshot.googleFontUrl) {
        urls.add(addon.props.snapshot.googleFontUrl)
      }
    }
  }
  return [...urls]
}
