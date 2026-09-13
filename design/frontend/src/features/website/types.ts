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

export type MediaRef = { fileId: string; url: string; fileName?: string; mimeType?: string }

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

export type SliderManualSlide = {
  id: string
  data: Record<string, unknown>
}

/** Basic display settings for one canvas breakpoint. */
export type SliderDisplaySettings = {
  itemsPerView: number
  showNavigation: boolean
  autoSlide: boolean
}

export type SliderAddonProps = {
  /** Snapshot of one preset root block used as the slide layout template. */
  slideTemplate: WebsiteBlock | null
  sourcePresetId?: string | null
  /**
   * `dataset` / `manual` own rows; `parent` takes an array/object path from the
   * ambient parent row (e.g. product.galleryImages under an outer products slider).
   */
  dataSource: 'dataset' | 'manual' | 'parent'
  datasetId: string | null
  /**
   * Which direct child under the slide shell (by `groupName`) is the repeating
   * card for each dataset/manual row. Same role as `BlockDataBinding.itemGroup`.
   */
  itemGroup?: string | null
  /**
   * When `dataSource === 'parent'`, dotted path on the parent row used as slide items.
   * Also used as fallback when a host template block sets `dataBinding.itemsPath`.
   */
  itemsPath?: string | null
  manualSlides: SliderManualSlide[]
  /** Per-breakpoint Basic settings; missing sizes inherit from the nearest larger screen. */
  displayByBreakpoint?: Partial<Record<WebsiteBreakpoint, SliderDisplaySettings>>
  /** @deprecated Prefer `displayByBreakpoint`; kept for legacy documents. */
  showNavigation?: boolean
  /** @deprecated Prefer `displayByBreakpoint`; kept for legacy documents. */
  autoSlide?: boolean
  /** @deprecated Prefer `displayByBreakpoint`; kept for legacy documents. */
  itemsPerView?: number
}

export const MAX_SLIDER_DATA_ITEMS = 48

export type MenuDisplayMode = 'inline' | 'hamburger' | 'wrap' | 'scroll'

export type MenuBreakpointSettings = {
  mode: MenuDisplayMode
  align: 'start' | 'center' | 'end'
  panelSide?: 'left' | 'right'
}

export type MenuItem = {
  id: string
  label: string
  textStyleId: string
  linkPageId: string | null
  children: MenuItem[]
}

export type MenuAddonProps = {
  displayByBreakpoint: Partial<Record<WebsiteBreakpoint, MenuBreakpointSettings>>
  items: MenuItem[]
}

export type AddonDataBinding = {
  fields: Partial<Record<string, string>>
}

export type BlockDataBinding = {
  datasetId: string | null
  itemGroup?: string | null
  itemGap?: number
  /**
   * Under an inherited parent row (e.g. slider item-group card), dotted path on
   * that row passed into this element — object scopes field maps; array feeds
   * nested list owners / parent-path sliders.
   */
  itemsPath?: string | null
}

export type ElementBorderRadius = 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type ElementBoxShadow = 'sm' | 'md' | 'lg'
export type ElementPadding = 1 | 2 | 3
export type ElementMargin = 1 | 2 | 3 | 4

/** Shared appearance chrome on content blocks and add-ons. */
export type ElementChrome = {
  backgroundColor?: string
  borderColor?: string
  borderRadius?: ElementBorderRadius
  boxShadow?: ElementBoxShadow
  padding?: ElementPadding
  margin?: ElementMargin
}

type WebsiteAddonBase = {
  id: string
  zIndex: number
  layout: LayoutByBreakpoint
  dataBinding?: AddonDataBinding
} & ElementChrome

export type WebsiteAddon =
  | (WebsiteAddonBase & {
      type: 'image'
      props: ImageAddonProps
    })
  | (WebsiteAddonBase & {
      type: 'text'
      props: TextAddonProps
    })
  | (WebsiteAddonBase & {
      type: 'button'
      props: ButtonAddonProps
    })
  | (WebsiteAddonBase & {
      type: 'slider'
      props: SliderAddonProps
    })
  | (WebsiteAddonBase & {
      type: 'menu'
      props: MenuAddonProps
    })

export type WebsiteBlock = {
  id: string
  zIndex: number
  groupName?: string
  dataBinding?: BlockDataBinding
  layout: LayoutByBreakpoint
  addons: WebsiteAddon[]
  children: WebsiteBlock[]
} & ElementChrome

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
  layoutId: string | null
  layoutName: string | null
  sortOrder: number
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type WebsiteLayoutPage = {
  id: string
  name: string
  path: string
  status: WebsitePageStatus
  sortOrder: number
}

export type WebsiteLayout = {
  id: string
  companyId: string
  name: string
  headerId: string | null
  footerId: string | null
  themeId: string | null
  isDefault: boolean
  pages: WebsiteLayoutPage[]
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

export type WebsitePreset = {
  id: string
  companyId: string
  name: string
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
  companyId: string
  webSlug: string
  webUrl: string
  page: WebsitePage
  header: WebsiteChrome | null
  footer: WebsiteChrome | null
  theme: WebsiteTheme | null
  pages: Array<{ id: string; name: string; path: string }>
}

export type WebsiteSiteSettings = {
  companyId: string
  homePageId: string | null
  updatedAt: string
}

export type WebsiteDesignerKind = 'pages' | 'headers' | 'footers' | 'presets'
export type WebsiteSection =
  | 'pages'
  | 'headers'
  | 'footers'
  | 'layouts'
  | 'presets'
  | 'datasets'
  | 'themes'
  | 'media'
  | 'settings'

export type WebsiteDatasetSourceType =
  | 'products'
  | 'services'
  | 'spaces'
  | 'staff'
  | 'users'
  | 'analytics'

export type WebsiteDatasetStatus = 'active' | 'inactive'

export type WebsiteDatasetFilters = {
  match: 'all'
  rules: Array<{
    field: string
    operator: string
    value: string | number | boolean | [number, number] | string[]
  }>
}

export type WebsiteDatasetConfig = {
  dimension?: string
  dateRange?: { from: string; to: string }
}

export type WebsiteDataset = {
  id: string
  companyId: string
  name: string
  sourceType: WebsiteDatasetSourceType
  filters: WebsiteDatasetFilters
  config: WebsiteDatasetConfig
  selectedFields: string[]
  status: WebsiteDatasetStatus
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type DesignerMode = 'visual' | 'edit'
export type DesignerSelection =
  | { kind: 'container' }
  | { kind: 'block'; blockId: string }
  | { kind: 'addon'; blockId: string; addonId: string }
  | {
      kind: 'templateBlock'
      hostBlockId: string
      sliderAddonId: string
      templateBlockId: string
    }
  | {
      kind: 'templateAddon'
      hostBlockId: string
      sliderAddonId: string
      templateBlockId: string
      templateAddonId: string
    }

export function isTemplateSelection(
  selection: DesignerSelection | null | undefined,
): selection is Extract<DesignerSelection, { kind: 'templateBlock' | 'templateAddon' }> {
  return selection?.kind === 'templateBlock' || selection?.kind === 'templateAddon'
}

export function selectionHostBlockId(selection: DesignerSelection | null | undefined): string | null {
  if (!selection || selection.kind === 'container') return null
  if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') return selection.hostBlockId
  return selection.blockId
}

export function emptyLayoutRect(overrides: Partial<LayoutRect> = {}): LayoutRect {
  return { col: 1, colSpan: 12, top: 16, height: 160, ...overrides }
}

export function emptyLayoutByBreakpoint(rect?: Partial<LayoutRect>): LayoutByBreakpoint {
  return { '2xl': emptyLayoutRect(rect) }
}

export function emptyWebsiteDocument(): WebsiteDocumentV1 {
  return { version: 1, container: { height: 640 }, blocks: [] }
}
