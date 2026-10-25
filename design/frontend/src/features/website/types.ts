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
  /** Page this image opens. Null hides the link. Empty means the link box is on and no page is chosen. */
  linkPageId?: string | null
}

export type TextAddonSnapshot = {
  fontFamily: string
  googleFontUrl?: string
  size: number
  color: string
}

export type TextAddonProps = {
  textStyleId: string
  /** Position in the theme text list. A theme change uses the style at this position. */
  textStyleIndex?: number | null
  content: string
  fontSizeByBreakpoint?: Partial<Record<WebsiteBreakpoint, number>>
  /** Page this text opens. Null hides the link. Empty means the link box is on and no page is chosen. */
  linkPageId?: string | null
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
  /** Position in the theme button list. A theme change uses the style at this position. */
  buttonStyleIndex?: number | null
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
export const MAX_LIST_DATA_ITEMS = 48

export type ListManualItem = {
  id: string
  data: Record<string, unknown>
}

/** Vertical list of one child template, repeated per manual row or dataset row. */
export type ListAddonProps = {
  itemTemplate: WebsiteBlock | null
  sourcePresetId?: string | null
  dataSource: 'dataset' | 'manual' | 'parent'
  datasetId: string | null
  /** Which direct child under the item shell (by `groupName`) is the repeating card. */
  itemGroup?: string | null
  /** When `dataSource === 'parent'`, dotted path on the parent row used as list items. */
  itemsPath?: string | null
  manualItems: ListManualItem[]
  /** Vertical space between items, in pixels. */
  itemGap: number
}

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
  /** Theme palette slot (1-based). Omitted means no background color. */
  backgroundColorIndex?: number
  /** Theme palette slot (1-based). Omitted means no border color. */
  borderColorIndex?: number
  /** Palette for background slot colors. Omitted uses {@link colorPaletteId} / parent inherit. */
  backgroundColorPaletteId?: string | null
  /** Palette for border slot colors. Omitted uses {@link colorPaletteId} / parent inherit. */
  borderColorPaletteId?: string | null
  borderRadius?: ElementBorderRadius
  boxShadow?: ElementBoxShadow
  padding?: ElementPadding
  margin?: ElementMargin
  /** Theme palette for child elements. Omitted means inherit from the parent. */
  colorPaletteId?: string | null
}

type WebsiteAddonBase = {
  id: string
  zIndex: number
  /** Shown in the element tree so this add-on can be told apart from others of the same type. */
  name?: string
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
      type: 'list'
      props: ListAddonProps
    })
  | (WebsiteAddonBase & {
      type: 'menu'
      props: MenuAddonProps
    })

export type WebsiteBlock = {
  id: string
  zIndex: number
  /** Shown in the element tree. Separate from groupName, which data binding uses. */
  name?: string
  groupName?: string
  /** Where this block sits in its parent row. Omitted blocks stay packed from the left. */
  place?: 'start' | 'center' | 'end'
  /** Page this block opens. Null hides the link. Empty means the link box is on and no page is chosen. */
  linkPageId?: string | null
  dataBinding?: BlockDataBinding
  layout: LayoutByBreakpoint
  addons: WebsiteAddon[]
  children: WebsiteBlock[]
  /** Shell markup for this block only. Children render at {{children}}, not inside this HTML. */
  customization?: WebsiteElementCustomization
} & ElementChrome

export type WebsiteDocumentV1 = {
  version: 1
  container: {
    /** Fallback height for sizes that have not been resized. */
    height: number
    /** Canvas height for sm, md, lg, xl, and 2xl. A resize writes only that size. */
    heightByBreakpoint?: Partial<Record<WebsiteBreakpoint, number>>
    backgroundColor?: string
  }
  blocks: WebsiteBlock[]
}

export type WebsitePageStatus = 'active' | 'inactive'
export type WebsitePublishStatus = 'draft' | 'published'

export type WebsitePage = {
  id: string
  companyId: string
  name: string
  path: string
  status: WebsitePageStatus
  publishStatus?: WebsitePublishStatus
  layoutId: string | null
  layoutName: string | null
  sortOrder: number
  document: WebsiteDocumentV1
  colorPaletteId: string | null
  sourceLibraryId: string | null
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
  publishStatus?: WebsitePublishStatus
  sourceLibraryId: string | null
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
  publishStatus?: WebsitePublishStatus
  document: WebsiteDocumentV1
  colorPaletteId: string | null
  sourceLibraryId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type WebsitePreset = {
  id: string
  companyId: string
  name: string
  publishStatus?: WebsitePublishStatus
  document: WebsiteDocumentV1
  colorPaletteId: string | null
  sourceLibraryId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type WebsiteFontToken = {
  id: string
  name: string
  googleFontUrl: string
  family: string
  sourceLibraryId?: string | null
}

export type WebsiteFontLibraryItem = {
  id: string
  name: string
  googleFontUrl: string
  family: string
  sortOrder: number
  publishStatus?: WebsitePublishStatus
}

export type WebsiteColorLibraryColor = {
  name: string
  value: string
}

export type WebsiteColorLibraryPalette = {
  colors: WebsiteColorLibraryColor[]
}

export type WebsiteColorLibraryItem = {
  id: string
  name: string
  palette: WebsiteColorLibraryPalette
  sortOrder: number
  publishStatus?: WebsitePublishStatus
}

export type WebsiteColorToken = {
  id: string
  name: string
  value: string
}

export type WebsiteThemePaletteColor = {
  name: string
  value: string
}

export type WebsiteThemeColorPalette = {
  id: string
  name: string
  sourceLibraryPaletteId?: string | null
  colors: WebsiteThemePaletteColor[]
}

export type WebsiteElementCustomization = {
  html: string
  styles: string
  scripts: string
}

export type WebsiteTextStyle = {
  id: string
  name: string
  fontId: string
  size: number
  sizeByBreakpoint?: Partial<Record<WebsiteBreakpoint, number>>
  colorIndex: number | null
  /** Style default palette; per-color overrides inherit when empty. */
  colorPaletteId?: string | null
  fontColorPaletteId?: string | null
  sourceLibraryId?: string | null
  customization?: WebsiteElementCustomization
}

export type WebsiteButtonStyle = {
  id: string
  name: string
  /** Fallback palette when per-color palette overrides are omitted. */
  colorPaletteId?: string | null
  backgroundColorPaletteId?: string | null
  textColorPaletteId?: string | null
  borderColorPaletteId?: string | null
  backgroundColorIndex: number | null
  textColorIndex: number | null
  textStyleId: string
  borderColorIndex: number | null
  borderWidth: number
  radius: number
  sourceLibraryId?: string | null
  customization?: WebsiteElementCustomization
}

export type WebsiteTextLibraryDefinition = {
  fontName: string
  googleFontUrl: string
  family: string
  colorName: string
  colorValue: string
  size: number
  sizeByBreakpoint?: WebsiteTextStyle['sizeByBreakpoint']
  customization?: WebsiteElementCustomization
}

export type WebsiteTextLibraryItem = {
  id: string
  name: string
  definition: WebsiteTextLibraryDefinition
  sortOrder: number
  publishStatus?: WebsitePublishStatus
}

export type WebsiteButtonLibraryDefinition = {
  backgroundColorName: string
  backgroundColorValue: string
  textColorName: string
  textColorValue: string
  borderColorName: string
  borderColorValue: string
  borderWidth: number
  radius: number
  textStyleName: string
  textFontName: string
  textGoogleFontUrl: string
  textFontFamily: string
  textSize: number
  labelColorName: string
  labelColorValue: string
  customization?: WebsiteElementCustomization
}

export type WebsiteButtonLibraryItem = {
  id: string
  name: string
  definition: WebsiteButtonLibraryDefinition
  sortOrder: number
  publishStatus?: WebsitePublishStatus
}

export type WebsiteTheme = {
  id: string
  companyId: string
  name: string
  pageBackground: string
  bodyTextColor: string
  surfaceColor?: string
  accentColor1?: string
  accentColor2?: string
  colorPaletteId: string
  /** 1-based palette on this theme. Empty follows the theme palette. */
  pageBackgroundPaletteIndex?: number | null
  surfacePaletteIndex?: number | null
  bodyTextPaletteIndex?: number | null
  accent1PaletteIndex?: number | null
  accent2PaletteIndex?: number | null
  pageBackgroundIndex: number | null
  surfaceIndex: number | null
  bodyTextIndex: number | null
  accent1Index: number | null
  accent2Index: number | null
  isActive: boolean
  isDefault: boolean
  publishStatus?: WebsitePublishStatus
  sourceLibraryId: string | null
  fonts: WebsiteFontToken[]
  colorPalettes: WebsiteThemeColorPalette[]
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
