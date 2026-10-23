import type { WebsiteAddon, WebsiteBreakpoint, WebsiteTextStyle, WebsiteTheme } from '../types'
import { resolveFontSize, textStyleSnapshot } from './theme'

export type CanvasTextRole = 'heading' | 'body'

const HEADING_NAME = /^(heading|h[1-3]|title|display|hero)$/i
const BODY_NAME = /^(body|paragraph|text|lead)$/i

function stylesList(theme: WebsiteTheme | null | undefined): WebsiteTextStyle[] {
  return theme?.textStyles ?? []
}

function byName(styles: WebsiteTextStyle[], pattern: RegExp): WebsiteTextStyle | undefined {
  return styles.find((style) => pattern.test(style.name.trim()))
}

function largestStyle(styles: WebsiteTextStyle[]): WebsiteTextStyle | undefined {
  if (styles.length === 0) return undefined
  return [...styles].sort((a, b) => resolveFontSize(b, '2xl') - resolveFontSize(a, '2xl'))[0]
}

function smallestStyle(styles: WebsiteTextStyle[]): WebsiteTextStyle | undefined {
  if (styles.length === 0) return undefined
  return [...styles].sort((a, b) => resolveFontSize(a, '2xl') - resolveFontSize(b, '2xl'))[0]
}

/** Maps AI `role` to a theme text style (Heading / Body or largest / smallest). */
export function resolveThemeTextStyleForRole(
  theme: WebsiteTheme | null | undefined,
  role: CanvasTextRole | undefined,
): WebsiteTextStyle | undefined {
  const styles = stylesList(theme)
  if (styles.length === 0 || !role) return undefined
  if (role === 'heading') {
    return (
      byName(styles, HEADING_NAME) ??
      styles.find((style) => /heading/i.test(style.id)) ??
      largestStyle(styles)
    )
  }
  return (
    byName(styles, BODY_NAME) ??
    styles.find((style) => /body/i.test(style.id)) ??
    smallestStyle(styles) ??
    styles[1] ??
    styles[0]
  )
}

export function themeFontSizeForRole(
  theme: WebsiteTheme | null | undefined,
  role: CanvasTextRole | undefined,
  breakpoint: WebsiteBreakpoint,
): number | undefined {
  const style = resolveThemeTextStyleForRole(theme, role)
  if (!style) return undefined
  return resolveFontSize(style, breakpoint)
}

export function isHeadingTextStyle(
  theme: WebsiteTheme | null | undefined,
  styleId: string | undefined,
  styleIndex: number | null | undefined,
): boolean {
  if (!styleId && styleIndex == null) return false
  const styles = stylesList(theme)
  const style = styleIndex != null && styleIndex >= 0 ? styles[styleIndex] : styles.find((item) => item.id === styleId)
  if (!style) return false
  const heading = resolveThemeTextStyleForRole(theme, 'heading')
  return heading?.id === style.id
}

export function formatThemeTextStylesForAssistant(theme: WebsiteTheme | null | undefined): string[] {
  const styles = stylesList(theme)
  if (styles.length === 0) {
    return ['theme-text-styles: (none loaded — use role heading for titles and role body for paragraphs).']
  }
  const lines = styles.map((style, index) => {
    const sizes = (['sm', 'md', '2xl'] as const)
      .map((bp) => `${bp} ${resolveFontSize(style, bp)}px`)
      .join(', ')
    return `- index ${index} id ${style.id} "${style.name}" (${sizes})`
  })
  const heading = resolveThemeTextStyleForRole(theme, 'heading')
  const body = resolveThemeTextStyleForRole(theme, 'body')
  return [
    'theme-text-styles: Use role heading on titles (maps to theme Heading — larger sizes). Use role body on paragraphs and details (maps to Body). Do not invent textStyleId; set role on add_addon and update_text instead.',
    ...(heading ? [`heading-role → "${heading.name}" (${heading.id})`] : []),
    ...(body ? [`body-role → "${body.name}" (${body.id})`] : []),
    ...lines,
    'Layout: one full-width section per add_block. Put the section title first with role heading (full row width). Stack body text below headings. Place related buttons in one row under the copy. Use move only when the outline shows misalignment.',
  ]
}

export function applyThemeTextRole(
  theme: WebsiteTheme | null | undefined,
  addon: Extract<WebsiteAddon, { type: 'text' }>,
  role: CanvasTextRole | undefined,
): Extract<WebsiteAddon, { type: 'text' }> {
  if (role !== 'heading' && role !== 'body') return addon
  const style = resolveThemeTextStyleForRole(theme, role)
  if (!style) {
    const fontSizeByBreakpoint =
      role === 'heading'
        ? { sm: 24, md: 28, lg: 32, xl: 36, '2xl': 40 }
        : { sm: 16, md: 16, lg: 18, xl: 18, '2xl': 18 }
    return { ...addon, props: { ...addon.props, fontSizeByBreakpoint } }
  }
  const styles = stylesList(theme)
  const resolvedIndex = styles.findIndex((item) => item.id === style.id)
  const nextProps = { ...addon.props }
  delete nextProps.fontSizeByBreakpoint
  return {
    ...addon,
    props: {
      ...nextProps,
      textStyleId: style.id,
      textStyleIndex: resolvedIndex >= 0 ? resolvedIndex : null,
      snapshot: textStyleSnapshot(theme ?? null, style, '2xl'),
    },
  }
}
