export const WEBSITE_BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const
export type WebsiteBreakpoint = (typeof WEBSITE_BREAKPOINTS)[number]

export const WEBSITE_CANVAS_WIDTH: Record<WebsiteBreakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function getBreakpointFromWidth(width: number): WebsiteBreakpoint {
  if (width >= WEBSITE_CANVAS_WIDTH['2xl']) return '2xl'
  if (width >= WEBSITE_CANVAS_WIDTH.xl) return 'xl'
  if (width >= WEBSITE_CANVAS_WIDTH.lg) return 'lg'
  if (width >= WEBSITE_CANVAS_WIDTH.md) return 'md'
  return 'sm'
}

export type LayoutRect = {
  col: number
  colSpan: number
  top: number
  height: number
}

export type LayoutByBreakpoint = { '2xl': LayoutRect } & Partial<
  Record<Exclude<WebsiteBreakpoint, '2xl'>, LayoutRect>
>

export type MediaRef = { fileId: string; url: string }

export type ImageAddonProps = {
  mediaByBreakpoint: Partial<Record<WebsiteBreakpoint, MediaRef>>
  fit: 'cover' | 'contain'
  heightMode: 'auto' | 'fixed'
  fixedHeight?: number
}

export type TextAddonSnapshot = {
  fontFamily: string
  googleFontUrl?: string
  size: number
  color: string
}

export type TextAddonProps = {
  textStyleId: string
  content: string
  fontSizeByBreakpoint?: Partial<Record<WebsiteBreakpoint, number>>
  snapshot: TextAddonSnapshot
}

export type ButtonAddonSnapshot = {
  background: string
  textColor: string
  borderColor: string
  borderWidth: number
  radius: number
  fontFamily: string
  googleFontUrl?: string
  fontSize: number
}

export type ButtonAddonProps = {
  buttonStyleId: string
  label: string
  linkPageId?: string | null
  snapshot: ButtonAddonSnapshot
}

export type WebsiteAddon =
  | {
      id: string
      type: 'image'
      zIndex: number
      layout: LayoutByBreakpoint
      props: ImageAddonProps
    }
  | {
      id: string
      type: 'text'
      zIndex: number
      layout: LayoutByBreakpoint
      props: TextAddonProps
    }
  | {
      id: string
      type: 'button'
      zIndex: number
      layout: LayoutByBreakpoint
      props: ButtonAddonProps
    }

export type WebsiteBlock = {
  id: string
  zIndex: number
  backgroundColor?: string
  layout: LayoutByBreakpoint
  addons: WebsiteAddon[]
}

export type WebsiteDocumentV1 = {
  version: 1
  container: { height: number; backgroundColor?: string }
  blocks: WebsiteBlock[]
}

export type WebsitePageStatus = 'active' | 'inactive'

export type WebsitePage = {
  id: string
  companyId: string
  name: string
  path: string
  status: WebsitePageStatus
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type WebsiteChrome = {
  id: string
  companyId: string
  name: string
  isDefault: boolean
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type WebsiteFontToken = {
  id: string
  name: string
  googleFontUrl: string
  family: string
}

export type WebsiteColorToken = {
  id: string
  name: string
  value: string
}

export type WebsiteTextStyle = {
  id: string
  name: string
  fontId: string
  size: number
  sizeByBreakpoint?: Partial<Record<WebsiteBreakpoint, number>>
  colorId: string
}

export type WebsiteButtonStyle = {
  id: string
  name: string
  backgroundColorId: string
  textColorId: string
  textStyleId: string
  borderColorId: string
  borderWidth: number
  radius: number
}

export type WebsiteTheme = {
  id: string
  companyId: string
  name: string
  pageBackground: string
  bodyTextColor: string
  isActive: boolean
  isDefault: boolean
  fonts: WebsiteFontToken[]
  colors: WebsiteColorToken[]
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type PublicWebsiteSite = {
  page: WebsitePage
  header: WebsiteChrome | null
  footer: WebsiteChrome | null
  theme: WebsiteTheme | null
  pages: Array<{ id: string; name: string; path: string }>
}

export type WebsiteDesignerKind = 'pages' | 'headers' | 'footers'
export type WebsiteSection = 'pages' | 'headers' | 'footers' | 'themes' | 'media'
export type DesignerMode = 'visual' | 'edit'
export type DesignerSelection =
  | { kind: 'container' }
  | { kind: 'block'; blockId: string }
  | { kind: 'addon'; blockId: string; addonId: string }

export function emptyLayoutRect(overrides: Partial<LayoutRect> = {}): LayoutRect {
  return { col: 1, colSpan: 12, top: 16, height: 160, ...overrides }
}

export function emptyLayoutByBreakpoint(rect?: Partial<LayoutRect>): LayoutByBreakpoint {
  return { '2xl': emptyLayoutRect(rect) }
}

export function emptyWebsiteDocument(): WebsiteDocumentV1 {
  return { version: 1, container: { height: 640 }, blocks: [] }
}
