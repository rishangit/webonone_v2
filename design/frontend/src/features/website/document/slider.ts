import { nanoid } from 'nanoid'
import {
  emptyLayoutByBreakpoint,
  MAX_SLIDER_DATA_ITEMS,
  WEBSITE_BREAKPOINTS,
  type SliderAddonProps,
  type SliderDisplaySettings,
  type WebsiteAddon,
  type WebsiteBlock,
  type WebsiteBreakpoint,
  type WebsiteDocumentV1,
} from '../types'
import { cloneBlockTree, findBlock, stripNestedSliders, updateAddon } from './blockTree'
import {
  getDataItemByPath,
  itemsFromDataValue,
  resolveAddonProps,
  resolveBlockDataItem,
} from './dataBinding'

const EMPTY_SLIDE_TEMPLATE_HEIGHT = 240

/** Empty slide root — full-width canvas that owns movable children/addons. */
export function createEmptySlideTemplate(height = EMPTY_SLIDE_TEMPLATE_HEIGHT): WebsiteBlock {
  return {
    id: nanoid(10),
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({
      col: 1,
      colSpan: 12,
      top: 0,
      height: Math.max(EMPTY_SLIDE_TEMPLATE_HEIGHT, height),
    }),
    addons: [],
    children: [],
  }
}

/**
 * Ensure the slider has a full-width slide shell. Presets/blocks live as movable children.
 * If an older document stored a preset as the slide root (with addons), wrap it as a child.
 */
export function ensureSliderSlideTemplate(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
): WebsiteDocumentV1 {
  const hostBlock = findBlock(document, hostBlockId)
  if (!hostBlock) return document
  const slider = hostBlock.addons.find((addon) => addon.id === sliderAddonId)
  if (!slider || slider.type !== 'slider') return document

  const shellHeight = slider.layout['2xl']?.height ?? EMPTY_SLIDE_TEMPLATE_HEIGHT
  const existing = slider.props.slideTemplate

  if (!existing) {
    return updateAddon(document, hostBlockId, {
      ...slider,
      props: {
        ...slider.props,
        slideTemplate: createEmptySlideTemplate(shellHeight),
        sourcePresetId: null,
      },
    })
  }

  // Preset-as-root: has its own addons → wrap so the preset can be positioned on the canvas.
  if (!isSlideShellTemplate(existing)) {
    const shell = createEmptySlideTemplate(
      Math.max(shellHeight, resolveLayoutRectHeight(existing) || shellHeight),
    )
    return updateAddon(document, hostBlockId, {
      ...slider,
      props: {
        ...slider.props,
        slideTemplate: { ...shell, children: [existing] },
        sourcePresetId: null,
      },
    })
  }

  return document
}

function resolveLayoutRectHeight(block: WebsiteBlock): number {
  return block.layout['2xl']?.height ?? block.layout.xl?.height ?? 0
}

/** Walk the document and wrap any preset-as-root slide templates into movable shells. */
export function normalizeSliderSlideShells(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  const cleaned = stripLegacyImageSliders(document)
  const targets: Array<{ hostBlockId: string; sliderAddonId: string }> = []
  function walk(block: WebsiteBlock) {
    for (const addon of block.addons ?? []) {
      if (addon.type === 'slider') {
        targets.push({ hostBlockId: block.id, sliderAddonId: addon.id })
      }
    }
    for (const child of block.children ?? []) walk(child)
  }
  for (const block of cleaned.blocks) walk(block)
  return targets.reduce(
    (doc, target) => ensureSliderSlideTemplate(doc, target.hostBlockId, target.sliderAddonId),
    cleaned,
  )
}

/** Drop removed `imageSlider` addons from legacy documents (use content slider + presets). */
export function stripLegacyImageSliders(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  function stripBlock(block: WebsiteBlock): WebsiteBlock {
    const addons = (block.addons ?? [])
      .filter((addon) => (addon as { type: string }).type !== 'imageSlider')
      .map((addon) => {
        if (addon.type !== 'slider' || !addon.props.slideTemplate) return addon
        return {
          ...addon,
          props: {
            ...addon.props,
            slideTemplate: stripBlock(addon.props.slideTemplate),
          },
        }
      })
    return {
      ...block,
      addons,
      children: (block.children ?? []).map(stripBlock),
    }
  }
  return {
    ...document,
    blocks: document.blocks.map(stripBlock),
  }
}

/** True when the slide root has no addons and no children (placeholder shell). */
export function isBlankSlideTemplate(block: WebsiteBlock | null | undefined): boolean {
  if (!block) return true
  return (block.addons?.length ?? 0) === 0 && (block.children?.length ?? 0) === 0
}

/**
 * Slide canvas shell: no addons of its own (children/presets are the visible content).
 * Prefer hiding the slide root by id in the tree; this still detects a clean shell.
 */
export function isSlideShellTemplate(block: WebsiteBlock | null | undefined): boolean {
  if (!block) return false
  return (block.addons?.length ?? 0) === 0
}

/** Grow shell (and slider addon) height so absolute children are not clipped. */
export function growSlideShellToFitContent(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
): WebsiteDocumentV1 {
  const ctx = findSliderHostContext(document, hostBlockId, sliderAddonId)
  if (!ctx) return document
  const shell = ctx.slideTemplate
  const shellRect = shell.layout['2xl']
  if (!shellRect) return document
  let bottom = shellRect.height
  for (const child of shell.children ?? []) {
    const rect = child.layout['2xl']
    if (rect) bottom = Math.max(bottom, rect.top + rect.height)
  }
  const nextHeight = Math.max(shellRect.height, bottom + 16)
  if (nextHeight <= shellRect.height) return document
  const nextShell: WebsiteBlock = {
    ...shell,
    layout: emptyLayoutByBreakpoint({
      col: shellRect.col,
      colSpan: shellRect.colSpan,
      top: shellRect.top,
      height: nextHeight,
    }),
  }
  const sliderRect = ctx.slider.layout['2xl']
  const nextSliderHeight = Math.max(sliderRect?.height ?? nextHeight, nextHeight)
  return updateAddon(document, hostBlockId, {
    ...ctx.slider,
    layout: emptyLayoutByBreakpoint({
      col: sliderRect?.col ?? 1,
      colSpan: sliderRect?.colSpan ?? 12,
      top: sliderRect?.top ?? 0,
      height: nextSliderHeight,
    }),
    props: { ...ctx.slider.props, slideTemplate: nextShell },
  })
}

function findParentInTree(root: WebsiteBlock, blockId: string): WebsiteBlock | null {
  for (const child of root.children ?? []) {
    if (child.id === blockId) return root
    const found = findParentInTree(child, blockId)
    if (found) return found
  }
  for (const addon of root.addons ?? []) {
    if (addon.type !== 'slider' || !addon.props.slideTemplate) continue
    if (addon.props.slideTemplate.id === blockId) return root
    const found = findParentInTree(addon.props.slideTemplate, blockId)
    if (found) return found
  }
  return null
}

function removeChildFromTree(root: WebsiteBlock, blockId: string): WebsiteBlock {
  const children = root.children ?? []
  if (children.some((child) => child.id === blockId)) {
    return { ...root, children: children.filter((child) => child.id !== blockId) }
  }
  let changed = false
  const nextChildren = children.map((child) => {
    const next = removeChildFromTree(child, blockId)
    if (next !== child) changed = true
    return next
  })
  const nextAddons = (root.addons ?? []).map((addon) => {
    if (addon.type !== 'slider' || !addon.props.slideTemplate) return addon
    const nextTemplate = removeChildFromTree(addon.props.slideTemplate, blockId)
    if (nextTemplate === addon.props.slideTemplate) return addon
    changed = true
    return {
      ...addon,
      props: { ...addon.props, slideTemplate: nextTemplate },
    }
  })
  if (!changed) return root
  return { ...root, children: nextChildren, addons: nextAddons }
}

/** Remove a non-shell template block from the slide tree. */
export function deleteTemplateBlock(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
): WebsiteDocumentV1 {
  const ctx = findSliderHostContext(document, hostBlockId, sliderAddonId)
  if (!ctx || templateBlockId === ctx.slideTemplate.id) return document
  if (!findBlockInTree(ctx.slideTemplate, templateBlockId)) return document
  return updateSlideTemplate(document, hostBlockId, sliderAddonId, (root) =>
    removeChildFromTree(root, templateBlockId),
  )
}

/** Swap zIndex among sibling template blocks under the same parent. */
export function changeTemplateBlockLayer(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
  direction: 'up' | 'down',
): WebsiteDocumentV1 {
  const ctx = findSliderHostContext(document, hostBlockId, sliderAddonId)
  if (!ctx || templateBlockId === ctx.slideTemplate.id) return document
  const parent = findParentInTree(ctx.slideTemplate, templateBlockId)
  if (!parent) return document
  return updateTemplateBlock(document, hostBlockId, sliderAddonId, parent.id, (block) => {
    const sorted = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
    const index = sorted.findIndex((child) => child.id === templateBlockId)
    if (index < 0) return block
    const swapWith = direction === 'up' ? index + 1 : index - 1
    if (swapWith < 0 || swapWith >= sorted.length) return block
    const current = sorted[index]!
    const other = sorted[swapWith]!
    const currentZ = current.zIndex
    return {
      ...block,
      children: sorted.map((child) => {
        if (child.id === current.id) return { ...child, zIndex: other.zIndex }
        if (child.id === other.id) return { ...child, zIndex: currentZ }
        return child
      }),
    }
  })
}

/** Duplicate a non-shell template block as the next sibling. */
export function duplicateTemplateBlock(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
): { document: WebsiteDocumentV1; id: string } | null {
  const ctx = findSliderHostContext(document, hostBlockId, sliderAddonId)
  if (!ctx || templateBlockId === ctx.slideTemplate.id) return null
  const source = findBlockInTree(ctx.slideTemplate, templateBlockId)
  const parent = findParentInTree(ctx.slideTemplate, templateBlockId)
  if (!source || !parent) return null
  const cloned = cloneBlockTree(source, source.zIndex + 1, null)
  const nextDoc = updateTemplateBlock(document, hostBlockId, sliderAddonId, parent.id, (block) => {
    const children = [...(block.children ?? [])]
    const index = children.findIndex((child) => child.id === templateBlockId)
    const insertAt = index < 0 ? children.length : index + 1
    const nextChildren = [...children]
    nextChildren.splice(insertAt, 0, cloned)
    return {
      ...block,
      children: nextChildren.map((child, i) => ({ ...child, zIndex: i })),
    }
  })
  return { document: nextDoc, id: cloned.id }
}

export type SliderBindableField = {
  path: string
  /** Addon prop key that consumes this path (`content`, `label`, `media`, `images`). */
  propKey: string
  kind: 'text' | 'media' | 'images'
}

export { stripNestedSliders }

/** Snapshot the first root block of a preset document as a reminted slide template. */
export function snapshotPresetAsSlideTemplate(presetDocument: WebsiteDocumentV1): WebsiteBlock | null {
  const roots = [...presetDocument.blocks].sort((a, b) => a.zIndex - b.zIndex)
  const first = roots[0]
  if (!first) return null
  return stripNestedSliders(cloneBlockTree(first, 0, null))
}

export function collectBindableFieldsFromTemplate(template: WebsiteBlock | null): SliderBindableField[] {
  if (!template) return []
  const byPath = new Map<string, SliderBindableField>()

  function walk(block: WebsiteBlock) {
    for (const addon of block.addons ?? []) {
      const fields = addon.dataBinding?.fields
      if (!fields) continue
      for (const [propKey, path] of Object.entries(fields)) {
        if (!path?.trim() || byPath.has(path)) continue
        const kind =
          propKey === 'media' ? 'media' : propKey === 'images' ? 'images' : 'text'
        byPath.set(path, { path, propKey, kind })
      }
    }
    for (const child of block.children ?? []) walk(child)
  }

  walk(template)
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
}

export function resolveSliderItems(input: {
  dataSource: 'dataset' | 'manual' | 'parent'
  datasetId: string | null
  itemsPath?: string | null
  manualSlides: Array<{ id: string; data: Record<string, unknown> }>
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  /** Ambient parent row when dataSource is `parent` (or host block itemsPath fallback). */
  parentDataItem?: Record<string, unknown> | null
  /** Cap total data rows (defaults to MAX_SLIDER_DATA_ITEMS). */
  maxItems?: number
}): Record<string, unknown>[] {
  const max = input.maxItems ?? MAX_SLIDER_DATA_ITEMS
  if (input.dataSource === 'manual') {
    return input.manualSlides.slice(0, max).map((slide) => slide.data)
  }
  if (input.dataSource === 'parent') {
    const path = input.itemsPath?.trim()
    if (!path || !input.parentDataItem) return []
    return itemsFromDataValue(getDataItemByPath(input.parentDataItem, path)).slice(0, max)
  }
  if (!input.datasetId) return []
  const rows = input.datasetItemsById?.[input.datasetId] ?? []
  return rows.slice(0, max)
}

/**
 * Width of one preset card inside the slider viewport.
 * Uses the preset's column span as a fraction of the slider width (actual designed proportion).
 */
export function sliderItemWidthPx(viewportWidth: number, templateColSpan: number): number {
  const span = Math.min(12, Math.max(1, templateColSpan))
  return Math.max(1, (span / 12) * Math.max(0, viewportWidth))
}

export const MIN_SLIDER_ITEMS_PER_VIEW = 1
export const MAX_SLIDER_ITEMS_PER_VIEW = 6

export const DEFAULT_SLIDER_DISPLAY_SETTINGS: SliderDisplaySettings = {
  itemsPerView: 1,
  showNavigation: true,
  autoSlide: false,
}

/** Clamp itemsPerView to the allowed Basic-settings range (default 1). */
export function clampSliderItemsPerView(value: number | null | undefined): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 1
  return Math.min(MAX_SLIDER_ITEMS_PER_VIEW, Math.max(MIN_SLIDER_ITEMS_PER_VIEW, n))
}

function normalizeSliderDisplaySettings(
  settings: Partial<SliderDisplaySettings>,
): SliderDisplaySettings {
  return {
    itemsPerView: clampSliderItemsPerView(settings.itemsPerView),
    showNavigation: settings.showNavigation ?? DEFAULT_SLIDER_DISPLAY_SETTINGS.showNavigation,
    autoSlide: settings.autoSlide ?? DEFAULT_SLIDER_DISPLAY_SETTINGS.autoSlide,
  }
}

/** Legacy flat Basic fields act as a 2xl fallback when displayByBreakpoint is empty. */
function legacySliderDisplaySettings(props: SliderAddonProps): SliderDisplaySettings | null {
  if (
    props.showNavigation === undefined &&
    props.autoSlide === undefined &&
    props.itemsPerView === undefined
  ) {
    return null
  }
  return normalizeSliderDisplaySettings({
    itemsPerView: props.itemsPerView,
    showNavigation: props.showNavigation,
    autoSlide: props.autoSlide,
  })
}

/**
 * Resolve Basic display settings for a canvas size.
 * Walks from the current breakpoint toward 2xl (same inheritance as layout).
 */
export function resolveSliderDisplaySettings(
  props: SliderAddonProps,
  breakpoint: WebsiteBreakpoint,
): SliderDisplaySettings {
  const byBreakpoint = props.displayByBreakpoint ?? {}
  const start = WEBSITE_BREAKPOINTS.indexOf(breakpoint)
  for (let i = start; i < WEBSITE_BREAKPOINTS.length; i += 1) {
    const key = WEBSITE_BREAKPOINTS[i]
    const entry = byBreakpoint[key]
    if (entry) return normalizeSliderDisplaySettings(entry)
  }
  return legacySliderDisplaySettings(props) ?? { ...DEFAULT_SLIDER_DISPLAY_SETTINGS }
}

/**
 * Patch Basic settings for one breakpoint only (copies resolved values, then applies patch).
 */
export function updateSliderDisplaySettings(
  props: SliderAddonProps,
  breakpoint: WebsiteBreakpoint,
  patch: Partial<SliderDisplaySettings>,
): SliderAddonProps {
  const current =
    props.displayByBreakpoint?.[breakpoint] ?? resolveSliderDisplaySettings(props, breakpoint)
  const next = normalizeSliderDisplaySettings({ ...current, ...patch })
  return {
    ...props,
    displayByBreakpoint: {
      ...props.displayByBreakpoint,
      [breakpoint]: next,
    },
  }
}

/**
 * Slot width for published/preview slides.
 * `itemsPerView === 1` keeps colSpan-based sizing; N > 1 uses equal viewport slots.
 */
export function sliderSlotWidthPx(
  viewportWidth: number,
  templateColSpan: number,
  itemsPerView: number,
  gapPx: number,
): number {
  const n = clampSliderItemsPerView(itemsPerView)
  const viewport = Math.max(0, viewportWidth)
  if (n <= 1) return sliderItemWidthPx(viewport, templateColSpan)
  const gaps = gapPx * (n - 1)
  return Math.max(1, (viewport - gaps) / n)
}

/** Number of navigation pages for a row list. */
export function sliderPageCount(itemCount: number, itemsPerView: number): number {
  const n = clampSliderItemsPerView(itemsPerView)
  if (itemCount <= 0) return 0
  return Math.ceil(itemCount / n)
}

/** Horizontal track offset for the active page (negative px). */
export function sliderPageTrackOffset(
  pageIndex: number,
  itemsPerView: number,
  stridePx: number,
): number {
  const n = clampSliderItemsPerView(itemsPerView)
  const page = Math.max(0, pageIndex)
  const offset = -(page * n * stridePx)
  return Object.is(offset, -0) ? 0 : offset
}

/**
 * Edit-mode canvas rows: first page only (up to itemsPerView).
 * Empty data → single null slot so the authoring shell still appears.
 */
export function sliderEditPreviewItems(
  items: Array<Record<string, unknown>>,
  itemsPerView: number,
): Array<Record<string, unknown> | null> {
  const n = clampSliderItemsPerView(itemsPerView)
  if (items.length === 0) return [null]
  return items.slice(0, n)
}

/** Apply a data row to every nested addon via existing field bindings; honor block itemsPath. */
export function applyDataItemToBlock(
  block: WebsiteBlock,
  dataItem: Record<string, unknown> | null,
): WebsiteBlock {
  const localItem = resolveBlockDataItem(block, dataItem)
  return {
    ...block,
    addons: (block.addons ?? []).map((addon) => resolveAddonProps(addon, localItem)),
    children: (block.children ?? []).map((child) => applyDataItemToBlock(child, localItem ?? dataItem)),
  }
}

/**
 * Block to render for one slide row.
 * In authoring mode the full shell is used; when `itemGroup` is set for
 * preview/publish, the matching child content element is the slide card.
 */
export function resolveSliderSlideBlock(
  template: WebsiteBlock,
  itemGroup: string | null | undefined,
  options?: { authoring?: boolean },
): WebsiteBlock {
  if (options?.authoring) return template
  const group = itemGroup?.trim()
  if (!group) return template
  const match = (template.children ?? []).find((child) => child.groupName?.trim() === group)
  return match ?? template
}

export function createEmptyManualSlide(
  fields: SliderBindableField[] = [],
): { id: string; data: Record<string, unknown> } {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    data[field.path] = field.kind === 'images' ? [] : field.kind === 'media' ? null : ''
  }
  return { id: nanoid(10), data }
}

export function blockContainsSlider(block: WebsiteBlock): boolean {
  if ((block.addons ?? []).some((addon) => addon.type === 'slider')) return true
  return (block.children ?? []).some(blockContainsSlider)
}

export function isSliderAddon(addon: WebsiteAddon): addon is Extract<WebsiteAddon, { type: 'slider' }> {
  return addon.type === 'slider'
}

export type SliderHostContext = {
  hostBlock: WebsiteBlock
  slider: Extract<WebsiteAddon, { type: 'slider' }>
  slideTemplate: WebsiteBlock
}

export function findSliderHostContext(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
): SliderHostContext | null {
  const hostBlock = findBlock(document, hostBlockId)
  if (!hostBlock) return null
  const slider = hostBlock.addons.find((addon) => addon.id === sliderAddonId)
  if (!slider || slider.type !== 'slider' || !slider.props.slideTemplate) return null
  return { hostBlock, slider, slideTemplate: slider.props.slideTemplate }
}

export function findBlockInTree(root: WebsiteBlock, blockId: string): WebsiteBlock | null {
  if (root.id === blockId) return root
  for (const child of root.children ?? []) {
    const found = findBlockInTree(child, blockId)
    if (found) return found
  }
  for (const addon of root.addons ?? []) {
    if (addon.type !== 'slider' || !addon.props.slideTemplate) continue
    const found = findBlockInTree(addon.props.slideTemplate, blockId)
    if (found) return found
  }
  return null
}

export function mapBlockInTree(
  root: WebsiteBlock,
  blockId: string,
  updater: (block: WebsiteBlock) => WebsiteBlock,
): WebsiteBlock {
  if (root.id === blockId) return updater(root)
  let changed = false
  const children = (root.children ?? []).map((child) => {
    const next = mapBlockInTree(child, blockId, updater)
    if (next !== child) changed = true
    return next
  })
  const addons = (root.addons ?? []).map((addon) => {
    if (addon.type !== 'slider' || !addon.props.slideTemplate) return addon
    const nextTemplate = mapBlockInTree(addon.props.slideTemplate, blockId, updater)
    if (nextTemplate === addon.props.slideTemplate) return addon
    changed = true
    return {
      ...addon,
      props: { ...addon.props, slideTemplate: nextTemplate },
    }
  })
  if (!changed) return root
  return { ...root, children, addons }
}

/**
 * Nearest enclosing nested slider `itemsPath` for a block under an outer slide template.
 * Used so field mappers inside a parent-path slider bind relative to each array item
 * (e.g. `url` under `galleryImages`), not the outer product row.
 */
export function findEnclosingSliderItemsPath(root: WebsiteBlock, blockId: string): string | null {
  let foundPath: string | null | undefined
  function visit(block: WebsiteBlock, itemsPath: string | null): boolean {
    if (block.id === blockId) {
      foundPath = itemsPath
      return true
    }
    for (const child of block.children ?? []) {
      if (visit(child, itemsPath)) return true
    }
    for (const addon of block.addons ?? []) {
      if (addon.type !== 'slider' || !addon.props.slideTemplate) continue
      const nestedPath =
        addon.props.dataSource === 'parent' && addon.props.itemsPath?.trim()
          ? addon.props.itemsPath.trim()
          : itemsPath
      if (visit(addon.props.slideTemplate, nestedPath)) return true
    }
    return false
  }
  visit(root, null)
  return foundPath === undefined ? null : foundPath
}

export function updateSlideTemplate(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  updater: (root: WebsiteBlock) => WebsiteBlock,
): WebsiteDocumentV1 {
  const ctx = findSliderHostContext(document, hostBlockId, sliderAddonId)
  if (!ctx) return document
  const nextTemplate = updater(ctx.slideTemplate)
  return updateAddon(document, hostBlockId, {
    ...ctx.slider,
    props: { ...ctx.slider.props, slideTemplate: nextTemplate },
  })
}

export function updateTemplateBlock(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
  updater: (block: WebsiteBlock) => WebsiteBlock,
): WebsiteDocumentV1 {
  return updateSlideTemplate(document, hostBlockId, sliderAddonId, (root) =>
    mapBlockInTree(root, templateBlockId, updater),
  )
}

export function updateTemplateAddon(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
  nextAddon: WebsiteAddon,
): WebsiteDocumentV1 {
  return updateTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId, (block) => ({
    ...block,
    addons: block.addons.map((addon) => (addon.id === nextAddon.id ? nextAddon : addon)),
  }))
}

export function deleteTemplateAddon(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
  templateAddonId: string,
): WebsiteDocumentV1 {
  return updateTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId, (block) => ({
    ...block,
    addons: block.addons.filter((addon) => addon.id !== templateAddonId),
  }))
}

export function changeTemplateAddonLayer(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
  templateAddonId: string,
  direction: 'up' | 'down',
): WebsiteDocumentV1 {
  return updateTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId, (block) => {
    const sorted = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
    const index = sorted.findIndex((addon) => addon.id === templateAddonId)
    if (index < 0) return block
    const swapWith = direction === 'up' ? index + 1 : index - 1
    if (swapWith < 0 || swapWith >= sorted.length) return block
    const current = sorted[index]!
    const other = sorted[swapWith]!
    const currentZ = current.zIndex
    return {
      ...block,
      addons: sorted.map((addon) => {
        if (addon.id === current.id) return { ...addon, zIndex: other.zIndex }
        if (addon.id === other.id) return { ...addon, zIndex: currentZ }
        return addon
      }),
    }
  })
}

export function resolveTemplateAddon(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId: string,
  templateAddonId: string,
): WebsiteAddon | null {
  const ctx = findSliderHostContext(document, hostBlockId, sliderAddonId)
  if (!ctx) return null
  const block = findBlockInTree(ctx.slideTemplate, templateBlockId)
  return block?.addons.find((addon) => addon.id === templateAddonId) ?? null
}
