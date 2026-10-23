import { nanoid } from 'nanoid'
import { createMenuItem } from '../addons/menu/menuItemUtils'
import {
  applyThemeTextRole,
  formatThemeTextStylesForAssistant,
  isHeadingTextStyle,
  themeFontSizeForRole,
  type CanvasTextRole,
} from './canvasThemeText'
import type {
  DesignerSelection,
  LayoutByBreakpoint,
  LayoutRect,
  WebsiteAddon,
  WebsiteBlock,
  WebsiteBreakpoint,
  WebsiteDocumentV1,
  WebsiteTheme,
} from '../types'
import { WEBSITE_BREAKPOINTS, WEBSITE_CANVAS_WIDTH } from '../types'
import { addBlock, deleteAddon, deleteBlock, findBlock, updateAddon, updateBlockById } from './blockTree'
import {
  ADDON_LAYOUT_LIMITS,
  clampRect,
  CONTENT_BLOCK_LAYOUT_LIMITS,
  documentContentHeight,
  resolveLayoutRect,
  ROW_HEIGHT,
  type LayoutLimits,
} from './layout'
import { createEmptySlideTemplate, DEFAULT_SLIDER_DISPLAY_SETTINGS, findBlockInTree, mapBlockInTree } from './slider'
import {
  defaultElementHtml,
  defaultElementStyles,
  effectiveElementHtml,
  effectiveElementStyles,
  normalizeWebsiteElementCustomization,
  storedBlockCustomization,
} from '../utils/websiteElementCustomization'

function createPlacedAddon(
  type: WebsiteAddon['type'],
  zIndex: number,
  layout: LayoutByBreakpoint,
): WebsiteAddon {
  const id = nanoid(10)
  if (type === 'text') {
    return {
      id,
      type,
      zIndex,
      layout,
      props: {
        textStyleId: '',
        content: 'Text',
        snapshot: { fontFamily: 'inherit', size: 16, color: '#111827' },
      },
    }
  }
  if (type === 'button') {
    return {
      id,
      type,
      zIndex,
      layout,
      props: {
        buttonStyleId: '',
        label: 'Button',
        linkPageId: null,
        snapshot: {
          background: '#111827',
          textColor: '#ffffff',
          borderColor: 'transparent',
          borderWidth: 0,
          radius: 6,
          fontFamily: 'inherit',
          fontSize: 16,
        },
      },
    }
  }
  if (type === 'image') {
    return {
      id,
      type,
      zIndex,
      layout,
      props: { mediaByBreakpoint: {}, fit: 'cover', heightMode: 'auto' },
    }
  }
  if (type === 'slider') {
    return {
      id,
      type,
      zIndex,
      layout,
      props: {
        slideTemplate: createEmptySlideTemplate(),
        sourcePresetId: null,
        dataSource: 'manual',
        datasetId: null,
        itemGroup: null,
        itemsPath: null,
        manualSlides: [],
        displayByBreakpoint: { '2xl': { ...DEFAULT_SLIDER_DISPLAY_SETTINGS } },
      },
    }
  }
  return {
    id,
    type: 'menu',
    zIndex,
    layout,
    props: {
      displayByBreakpoint: { '2xl': { mode: 'inline', align: 'start' } },
      items: [createMenuItem('Home'), createMenuItem('About')],
    },
  }
}

const ADDON_TYPES = new Set(['text', 'button', 'image', 'slider', 'menu'])
const SPANS = new Set(['full', 'half', 'third', 'quarter'])
const ROLES = new Set(['heading', 'body'])
const PLACES = new Set(['start', 'center', 'end'])
const FLOW_BREAKPOINTS = ['sm', 'md', '2xl'] as const satisfies readonly WebsiteBreakpoint[]

type CanvasOp = {
  op: string
  type?: string
  blockId?: string
  addonId?: string
  text?: string
  items?: string[]
  span?: string
  role?: string
  group?: boolean
  align?: 'start' | 'center' | 'end'
  elementName?: string
  col?: number
  row?: number
  cols?: number
  rows?: number
  html?: string
  styles?: string
  scripts?: string
}

export type CanvasApplyResult = {
  document: WebsiteDocumentV1
  applied: number
  selection: DesignerSelection | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function addonTypeFromLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.toLowerCase()
  if (/\b(logo|image|photo|picture|icon)\b/.test(text)) return 'image'
  if (/\b(menu|navigation|nav)\b/.test(text)) return 'menu'
  if (/\bbutton\b/.test(text)) return 'button'
  if (/\b(slider|carousel)\b/.test(text)) return 'slider'
  return undefined
}

function inferredAddonType(op: Record<string, unknown>): string | undefined {
  const rawOp = typeof op.op === 'string' ? op.op.trim().toLowerCase().replace(/[\s-]+/g, '_') : ''
  if (rawOp === 'add_text' || rawOp === 'insert_text' || rawOp === 'create_text') return 'text'
  if (rawOp === 'add_button' || rawOp === 'insert_button') return 'button'
  if (rawOp === 'add_menu' || rawOp === 'insert_menu') return 'menu'
  if (rawOp === 'add_slider' || rawOp === 'insert_slider' || rawOp === 'add_carousel') return 'slider'
  if (rawOp === 'add_image' || rawOp === 'insert_image' || rawOp === 'create_image' || rawOp === 'add_hero_image' || /\bimage\b/.test(rawOp)) {
    return 'image'
  }
  if (typeof op.type === 'string') {
    const type = op.type.trim().toLowerCase()
    if (ADDON_TYPES.has(type)) return type
    if (type === 'hero' || type === 'banner' || type === 'photo' || type === 'picture' || type === 'logo' || type === 'background') {
      return 'image'
    }
  }
  const items = Array.isArray(op.items) ? op.items : []
  if (items.some((item) => typeof item === 'string' && item.trim())) return 'menu'
  if (typeof op.text === 'string' && op.text.trim()) return 'text'
  return addonTypeFromLabel(op.name)
}

/** Logo sits on the left of a header and the menu sits on the right. */
function headerChromeSide(
  changeName: string | undefined,
  label: string | undefined,
  type: string | undefined,
): CanvasOp['align'] {
  if (!changeName || !/\bheader\b/i.test(changeName)) return undefined
  const text = `${label ?? ''}`.toLowerCase()
  if (/\b(logo|brand)\b/.test(text) || /\bleft\b/.test(text) || type === 'image') return 'start'
  if (/\b(menu|navigation|nav)\b/.test(text) || /\bright\b/.test(text) || type === 'menu') return 'end'
  return undefined
}

function readOps(args: Record<string, unknown>): CanvasOp[] {
  if (!Array.isArray(args.operations)) return []
  return args.operations.flatMap((operation) => {
    const op = normalizeCanvasOp(operation)
    if (!op) return []
    return [{
    op: inferredCanvasOp(op),
    type: inferredAddonType(op),
    blockId: typeof op.blockId === 'string' ? op.blockId : undefined,
    addonId: typeof op.addonId === 'string' ? op.addonId : undefined,
    text: typeof op.text === 'string' ? op.text : undefined,
    items: Array.isArray(op.items) ? op.items.filter((item): item is string => typeof item === 'string') : undefined,
    span: typeof op.span === 'string' && SPANS.has(op.span) ? op.span : undefined,
    role: typeof op.role === 'string' && ROLES.has(op.role) ? op.role : undefined,
    group: op.group === true || (typeof op.op === 'string' && /group/i.test(op.op)),
    align: typeof op.align === 'string' && PLACES.has(op.align) ? (op.align as CanvasOp['align']) : undefined,
    col: readGrid(op.col, 1, 12),
    row: readGrid(op.row, 0, 200),
    cols: readGrid(op.cols, 1, 12),
    rows: readGrid(op.rows, 1, 80),
    elementName: displayName(
      typeof op.name === 'string' ? op.name : undefined,
      op.op === 'rename' && typeof op.text === 'string' ? op.text : undefined,
    ),
    html: readCode(op.html),
    styles: readCode(op.styles),
    scripts: readCode(op.scripts),
  }]
  })
}

function normalizeCanvasOp(operation: unknown): Record<string, unknown> | null {
  if (typeof operation === 'string') {
    const value = operation.toLowerCase()
    const image = /\b(image|photo|picture|banner)\b/.test(value)
    const section = /\b(section|block)\b/.test(value)
    const name = operation.trim().slice(0, 64)
    if (image && !section) return { op: 'add_addon', type: 'image', name: name || 'Hero image', span: 'full' }
    if (section) return { op: 'add_block', name: name || 'Hero image' }
    if (/\bhero\b/.test(value)) return { op: 'add_addon', type: 'image', name: name || 'Hero image', span: 'full' }
    return null
  }
  return isRecord(operation) ? operation : null
}

function inferredCanvasOp(op: Record<string, unknown>): string {
  const raw = typeof op.op === 'string' ? op.op.trim().toLowerCase().replace(/[\s-]+/g, '_') : ''
  if (raw === 'add_block' || raw === 'add_addon' || raw === 'update_text' || raw === 'update_button' || raw === 'update_menu' || raw === 'update_block' || raw === 'rename' || raw === 'place_block' || raw === 'move' || raw === 'delete_block' || raw === 'delete_addon') {
    return raw
  }
  if (
    raw === 'add_image' ||
    raw === 'insert_image' ||
    raw === 'create_image' ||
    raw === 'add_hero_image' ||
    raw === 'add_text' ||
    raw === 'insert_text' ||
    raw === 'create_text' ||
    raw === 'add_button' ||
    raw === 'insert_button' ||
    raw === 'add_menu' ||
    raw === 'insert_menu' ||
    raw === 'add_slider' ||
    raw === 'insert_slider' ||
    raw === 'add_carousel'
  ) {
    return 'add_addon'
  }
  if (raw === 'add_section' || raw === 'create_section' || raw === 'insert_section' || raw === 'add_hero' || raw === 'add_group' || raw === 'insert_group') {
    return 'add_block'
  }
  const hasGrid = ['col', 'row', 'cols', 'rows'].some((key) => op[key] != null && op[key] !== '')
  if (hasGrid && (typeof op.blockId === 'string' || typeof op.addonId === 'string')) return 'move'
  const type = typeof op.type === 'string' ? op.type.trim().toLowerCase() : ''
  if (type === 'image' || type === 'hero' || type === 'banner' || type === 'photo' || type === 'text' || type === 'button' || type === 'menu' || type === 'slider') {
    return 'add_addon'
  }
  if (type === 'section' || type === 'block' || type === 'group') return 'add_block'
  const label = typeof op.name === 'string' ? op.name : ''
  if (/\b(image|photo|picture|banner)\b/i.test(label) && !/\b(section|block)\b/i.test(label)) return 'add_addon'
  if (/\b(section|block)\b/i.test(label)) return 'add_block'
  return ''
}

function readCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.slice(0, 50000)
}

function readGrid(value: unknown, min: number, max: number): number | undefined {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  if (!Number.isFinite(number)) return undefined
  return Math.min(max, Math.max(min, Math.round(number)))
}

function displayName(explicit: string | undefined, fallback?: string): string | undefined {
  const source = explicit?.trim() || fallback?.trim()
  if (!source) return undefined
  const line = source.split('\n')[0]?.trim() ?? ''
  return line ? line.slice(0, 64) : undefined
}

function nameBlock(document: WebsiteDocumentV1, blockId: string, name: string | undefined): WebsiteDocumentV1 {
  if (!name) return document
  return updateBlockById(document, blockId, (block) => ({ ...block, name }))
}

function alignFromLabel(label: string | undefined): CanvasOp['align'] {
  if (!label) return undefined
  const text = label.toLowerCase()
  const asksToMove = /\b(align|move|place|shift)\b/.test(text) || /\bto the (right|left|center)\b/.test(text)
  if (!asksToMove) return undefined
  if (/\bright\b|\bend\b/.test(text)) return 'end'
  if (/\bcenter\b|\bmiddle\b/.test(text)) return 'center'
  if (/\bleft\b|\bstart\b/.test(text)) return 'start'
  return undefined
}

function fontSizeFor(role: string | undefined, breakpoint: WebsiteBreakpoint): number {
  if (role === 'heading') {
    if (breakpoint === 'sm') return 24
    if (breakpoint === 'md') return 28
    if (breakpoint === 'lg') return 32
    if (breakpoint === 'xl') return 36
    return 40
  }
  if (breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl') return 18
  return 16
}

function resolvedFontSize(
  type: string,
  role: string | undefined,
  breakpoint: WebsiteBreakpoint,
  theme: WebsiteTheme | null,
): number {
  if (type === 'button' || type === 'menu') return 16
  if (role === 'heading' || role === 'body') {
    return themeFontSizeForRole(theme, role as CanvasTextRole, breakpoint) ?? fontSizeFor(role, breakpoint)
  }
  return fontSizeFor(role, breakpoint)
}

function wrapLines(lines: string[], charsPerLine: number): string[] {
  const wrapped: string[] = []
  for (const line of lines) {
    const text = line.trim() || ' '
    if (text.length <= charsPerLine) {
      wrapped.push(text)
      continue
    }
    for (let index = 0; index < text.length; index += charsPerLine) {
      wrapped.push(text.slice(index, index + charsPerLine))
    }
  }
  return wrapped.length > 0 ? wrapped : [' ']
}

/** Pixel size of the rendered content. Rounded up so the box shows the full text. */
function contentPixels(
  type: string,
  text: string | undefined,
  items: string[] | undefined,
  role: string | undefined,
  breakpoint: WebsiteBreakpoint,
  theme: WebsiteTheme | null = null,
): { width: number; height: number } {
  if (type === 'image') return { width: 160, height: 160 }
  if (type === 'slider') return { width: 320, height: 192 }
  const font = resolvedFontSize(type, role, breakpoint, theme)
  const padX = type === 'button' || type === 'menu' ? 24 : 16
  const padY = type === 'button' || type === 'menu' ? 16 : 16
  const lineHeight = type === 'text' && role === 'heading' ? 1.15 : 1.45
  const fallback = type === 'button' ? 'Button' : type === 'menu' ? 'Home' : 'Text'
  const source =
    type === 'menu'
      ? [(items && items.length > 0 ? items : ['Home', 'About']).join('  ')]
      : (text?.trim() ? text : fallback).split('\n')
  const maxWidth = WEBSITE_CANVAS_WIDTH[breakpoint]
  const charWidth = font * 0.7
  let lines = source
  let width = Math.ceil(Math.max(1, ...lines.map((line) => line.trim().length || 1)) * charWidth + padX + 8)
  if (width > maxWidth) {
    const chars = Math.max(1, Math.floor((maxWidth - padX - 8) / charWidth))
    lines = wrapLines(source, chars)
    width = maxWidth
  }
  const height = Math.ceil((lines.length * font * lineHeight + padY + 8) / ROW_HEIGHT) * ROW_HEIGHT
  return { width, height }
}

function columnsForPixels(width: number, breakpoint: WebsiteBreakpoint): number {
  const column = WEBSITE_CANVAS_WIDTH[breakpoint] / 12
  return Math.min(12, Math.max(1, Math.ceil(width / column)))
}

function placeRect(existing: LayoutRect[], colSpan: number, height: number): LayoutRect {
  const span = Math.min(12, Math.max(1, colSpan))
  const heightPx = Math.max(1, Math.ceil(height))
  if (existing.length === 0) return { col: 1, colSpan: span, top: 0, height: heightPx }
  const lastTop = Math.max(...existing.map((rect) => rect.top))
  const lastRow = existing.filter((rect) => rect.top === lastTop)
  const right = Math.max(...lastRow.map((rect) => rect.col + rect.colSpan - 1))
  const nextCol = right + 1
  if (nextCol + span - 1 <= 12) return { col: nextCol, colSpan: span, top: lastTop, height: heightPx }
  const bottom = Math.max(...lastRow.map((rect) => rect.top + rect.height))
  return { col: 1, colSpan: span, top: bottom, height: heightPx }
}

function flowAddonLayout(
  siblings: WebsiteAddon[],
  type: string,
  text: string | undefined,
  items: string[] | undefined,
  role: string | undefined,
  theme: WebsiteTheme | null,
): LayoutByBreakpoint {
  const layout = {} as LayoutByBreakpoint
  for (const breakpoint of FLOW_BREAKPOINTS) {
    const size = contentPixels(type, text, items, role, breakpoint, theme)
    const occupied = siblings.map((addon) => resolveLayoutRect(addon.layout, breakpoint))
    let colSpan = columnsForPixels(size.width, breakpoint)
    if (type === 'text' && role === 'heading' && siblings.length === 0) {
      colSpan = 12
    } else if (type === 'text' && role === 'body' && siblings.length === 0) {
      colSpan = Math.min(12, Math.max(colSpan, 10))
    }
    layout[breakpoint] = placeRect(occupied, colSpan, size.height)
  }
  return layout
}

function placeNewBlock(before: WebsiteDocumentV1, blockId: string, document: WebsiteDocumentV1): WebsiteDocumentV1 {
  const layout = {} as LayoutByBreakpoint
  for (const breakpoint of FLOW_BREAKPOINTS) {
    const bottom = documentContentHeight(before, breakpoint)
    layout[breakpoint] = { col: 1, colSpan: 1, top: bottom, height: 1 }
  }
  return updateBlockById(document, blockId, (block) => ({ ...block, layout }))
}

/** Park a new group beside existing groups. Its box is tightened to the content after the add-ons land. */
function placeChildBlock(document: WebsiteDocumentV1, parentId: string, childId: string): WebsiteDocumentV1 {
  const parent = findBlock(document, parentId)
  const siblings = (parent?.children ?? []).filter((child) => child.id !== childId)
  const layout = {} as LayoutByBreakpoint
  for (const breakpoint of FLOW_BREAKPOINTS) {
    const occupied = siblings.map((child) => resolveLayoutRect(child.layout, breakpoint))
    layout[breakpoint] = placeRect(occupied, 1, 1)
  }
  return updateBlockById(document, childId, (block) => ({ ...block, layout }))
}

function fitBlock(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  return updateBlockById(document, blockId, (block) => {
    const layout: LayoutByBreakpoint = { ...block.layout }
    for (const breakpoint of FLOW_BREAKPOINTS) {
      const current = resolveLayoutRect(layout, breakpoint)
      const items = [...block.addons, ...(block.children ?? [])]
      if (items.length === 0) continue
      let bottom = 0
      let right = current.col - 1
      for (const item of items) {
        const rect = resolveLayoutRect(item.layout, breakpoint)
        bottom = Math.max(bottom, rect.top + rect.height)
        right = Math.max(right, rect.col + rect.colSpan - 1)
      }
      layout[breakpoint] = {
        ...current,
        colSpan: Math.max(1, right - current.col + 1),
        height: Math.max(1, bottom),
      }
    }
    return { ...block, layout }
  })
}

function parentBlockId(blocks: WebsiteBlock[], blockId: string, parentId: string | null): string | null | undefined {
  for (const block of blocks) {
    if (block.id === blockId) return parentId
    const nested = parentBlockId(block.children ?? [], blockId, block.id)
    if (nested !== undefined) return nested
  }
  return undefined
}

/** Grow a block so children stay inside it. Never shrinks a size the user already set. */
function growBlock(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  return updateBlockById(document, blockId, (block) => {
    const layout: LayoutByBreakpoint = { ...block.layout }
    for (const breakpoint of FLOW_BREAKPOINTS) {
      const current = resolveLayoutRect(layout, breakpoint)
      const items = [...block.addons, ...(block.children ?? [])]
      if (items.length === 0) continue
      let bottom = current.height
      let right = current.colSpan
      for (const item of items) {
        const rect = resolveLayoutRect(item.layout, breakpoint)
        bottom = Math.max(bottom, rect.top + rect.height)
        right = Math.max(right, rect.col + rect.colSpan - 1)
      }
      layout[breakpoint] = { ...current, colSpan: Math.max(current.colSpan, right), height: bottom }
    }
    return { ...block, layout }
  })
}

function growFromBlock(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  let next = growBlock(document, blockId)
  let parent = parentBlockId(next.blocks, blockId, null)
  while (parent) {
    next = growBlock(next, parent)
    parent = parentBlockId(next.blocks, parent, null)
  }
  return next
}

function widenForContent(
  document: WebsiteDocumentV1,
  blockId: string,
  theme: WebsiteTheme | null,
): WebsiteDocumentV1 {
  let next = document
  const block = findBlock(next, blockId)
  if (!block) return next
  for (const breakpoint of FLOW_BREAKPOINTS) {
    const current = findBlock(next, blockId)
    if (!current) break
    const canvas = WEBSITE_CANVAS_WIDTH[breakpoint]
    let colSpan = resolveLayoutRect(current.layout, breakpoint).colSpan
    for (const addon of current.addons) {
      const child = resolveLayoutRect(addon.layout, breakpoint)
      const want = contentPixels(
        addon.type,
        addonText(addon),
        addonItems(addon),
        addonRole(addon, theme),
        breakpoint,
        theme,
      ).width
      if (child.colSpan <= 0) continue
      const required = Math.ceil((want * 12) / (child.colSpan * (canvas / 12)))
      colSpan = Math.max(colSpan, Math.min(12, required))
    }
    const rect = resolveLayoutRect(current.layout, breakpoint)
    if (colSpan > rect.colSpan) {
      next = updateBlockById(next, blockId, (item) => ({
        ...item,
        layout: { ...item.layout, [breakpoint]: { ...resolveLayoutRect(item.layout, breakpoint), colSpan } },
      }))
    }
  }
  const parent = parentBlockId(next.blocks, blockId, null)
  return parent ? widenForContent(next, parent, theme) : next
}

function pinBlockAlign(
  document: WebsiteDocumentV1,
  blockId: string,
  place: 'start' | 'center' | 'end',
): WebsiteDocumentV1 {
  let next = placeBlock(document, blockId, place)
  const parentId = parentBlockId(next.blocks, blockId, null)
  for (const breakpoint of FLOW_BREAKPOINTS) {
    const block = findBlock(next, blockId)
    if (!block) return next
    const rect = resolveLayoutRect(block.layout, breakpoint)
    const col =
      place === 'end'
        ? Math.max(1, 13 - rect.colSpan)
        : place === 'center'
          ? Math.max(1, Math.floor((12 - rect.colSpan) / 2) + 1)
          : 1
    next = updateBlockById(next, blockId, (current) => ({
      ...current,
      layout: { ...current.layout, [breakpoint]: { ...resolveLayoutRect(current.layout, breakpoint), col } },
    }))
    if (parentId && place !== 'start') {
      next = updateBlockById(next, parentId, (parent) => {
        const parentRect = resolveLayoutRect(parent.layout, breakpoint)
        return {
          ...parent,
          layout: { ...parent.layout, [breakpoint]: { ...parentRect, col: 1, colSpan: 12 } },
        }
      })
    }
  }
  return next
}

function fitFromBlock(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  let next = fitBlock(document, blockId)
  let parent = parentBlockId(next.blocks, blockId, null)
  while (parent) {
    next = fitBlock(next, parent)
    parent = parentBlockId(next.blocks, parent, null)
  }
  return next
}

function flowInto(items: { w: number; h: number }[], parentPx: number): { rects: LayoutRect[]; height: number } | null {
  const inner = parentPx / 12
  const rects: LayoutRect[] = []
  let col = 1
  let top = 0
  let rowHeight = 0
  for (const item of items) {
    const span = Math.max(1, Math.ceil(item.w / inner))
    if (span > 12) return null
    if (col > 1 && col + span - 1 > 12) {
      top += rowHeight
      col = 1
      rowHeight = 0
    }
    rects.push({ col, colSpan: span, top, height: item.h })
    col += span
    rowHeight = Math.max(rowHeight, item.h)
  }
  return { rects, height: Math.max(1, top + rowHeight) }
}

/** Parent box is the size of its children, widened until every child still fits. */
function packToEdge(
  items: { w: number; h: number; place?: 'start' | 'center' | 'end' }[],
  canvasWidth: number,
): { cols: number; width: number; height: number; rects: LayoutRect[] } | null {
  const column = canvasWidth / 12
  const spans = items.map((item) => Math.max(1, Math.min(12, Math.ceil(item.w / column))))
  if (spans.reduce((sum, span) => sum + span, 0) > 12) return null
  const rects: LayoutRect[] = []
  let col = 1
  for (let index = 0; index < items.length; index += 1) {
    if (items[index]?.place === 'end' || items[index]?.place === 'center') continue
    rects[index] = { col, colSpan: spans[index]!, top: 0, height: items[index]!.h }
    col += spans[index]!
  }
  let endCol = 13
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index]?.place !== 'end') continue
    endCol -= spans[index]!
    if (endCol < col) return null
    rects[index] = { col: endCol, colSpan: spans[index]!, top: 0, height: items[index]!.h }
  }
  let centerCol = col + Math.max(0, Math.floor((endCol - col - items.reduce((sum, item, index) => sum + (item.place === 'center' ? spans[index]! : 0), 0)) / 2))
  for (let index = 0; index < items.length; index += 1) {
    if (items[index]?.place !== 'center') continue
    if (centerCol + spans[index]! > endCol) return null
    rects[index] = { col: centerCol, colSpan: spans[index]!, top: 0, height: items[index]!.h }
    centerCol += spans[index]!
  }
  if (rects.length !== items.length || rects.some((rect) => !rect)) return null
  return {
    cols: 12,
    width: canvasWidth,
    height: Math.max(1, ...items.map((item) => item.h)),
    rects,
  }
}

function pack(items: { w: number; h: number; place?: 'start' | 'center' | 'end' }[], canvasWidth: number): { cols: number; width: number; height: number; rects: LayoutRect[] } {
  if (items.some((item) => item.place === 'end' || item.place === 'center')) {
    const aligned = packToEdge(items, canvasWidth)
    if (aligned) return aligned
  }
  const column = canvasWidth / 12
  const widest = Math.max(1, ...items.map((item) => item.w))
  let cols = Math.min(12, Math.max(1, Math.ceil(widest / column)))
  while (cols <= 12) {
    const width = cols * column
    const flowed = flowInto(items, width)
    if (flowed) return { cols, width, height: flowed.height, rects: flowed.rects }
    cols += 1
  }
  const flowed = flowInto(items, canvasWidth)
  return { cols: 12, width: canvasWidth, height: flowed?.height ?? 1, rects: flowed?.rects ?? [] }
}

function addonText(addon: WebsiteAddon): string | undefined {
  if (addon.type === 'text') return addon.props.content
  if (addon.type === 'button') return addon.props.label
  return undefined
}

function addonItems(addon: WebsiteAddon): string[] | undefined {
  if (addon.type !== 'menu') return undefined
  return addon.props.items.map((item) => item.label)
}

function addonRole(addon: WebsiteAddon, theme: WebsiteTheme | null): string | undefined {
  if (addon.type !== 'text') return undefined
  if (isHeadingTextStyle(theme, addon.props.textStyleId, addon.props.textStyleIndex ?? null)) return 'heading'
  if (addon.props.textStyleId || addon.props.textStyleIndex != null) return 'body'
  if (!addon.props.fontSizeByBreakpoint) return undefined
  return (addon.props.fontSizeByBreakpoint['2xl'] ?? 0) >= 24 ? 'heading' : 'body'
}

function layoutBlock(
  document: WebsiteDocumentV1,
  blockId: string,
  breakpoint: WebsiteBreakpoint,
  theme: WebsiteTheme | null,
): { document: WebsiteDocumentV1; width: number; height: number; cols: number } {
  const block = findBlock(document, blockId)
  if (!block) return { document, width: 1, height: 1, cols: 1 }
  let next = document
  const pieces: {
    w: number
    h: number
    place?: 'start' | 'center' | 'end'
    write: (doc: WebsiteDocumentV1, rect: LayoutRect) => WebsiteDocumentV1
  }[] = []

  for (const addon of [...block.addons].sort((a, b) => a.zIndex - b.zIndex)) {
    const role = addonRole(addon, theme)
    let size = contentPixels(addon.type, addonText(addon), addonItems(addon), role, breakpoint, theme)
    if (addon.type === 'text' && role === 'heading') {
      size = { ...size, width: WEBSITE_CANVAS_WIDTH[breakpoint] }
    }
    pieces.push({
      w: size.width,
      h: size.height,
      write: (doc, rect) =>
        updateAddon(doc, blockId, {
          ...addon,
          layout: { ...addon.layout, [breakpoint]: rect },
        }),
    })
  }

  for (const child of [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)) {
    const nested = layoutBlock(next, child.id, breakpoint, theme)
    next = nested.document
    pieces.push({
      w: nested.width,
      h: nested.height,
      place: findBlock(next, child.id)?.place,
      write: (doc, rect) =>
        updateBlockById(doc, child.id, (current) => ({
          ...current,
          layout: {
            ...current.layout,
            [breakpoint]: { col: rect.col, colSpan: rect.colSpan, top: rect.top, height: nested.height },
          },
        })),
    })
  }

  if (pieces.length === 0) return { document: next, width: 1, height: 1, cols: 1 }
  const packed = pack(
    pieces.map((piece) => ({ w: piece.w, h: piece.h, place: piece.place })),
    WEBSITE_CANVAS_WIDTH[breakpoint],
  )
  pieces.forEach((piece, index) => {
    const rect = packed.rects[index]
    if (!rect) return
    next = piece.write(next, rect)
  })
  return { document: next, width: packed.width, height: packed.height, cols: packed.cols }
}

/** Rewrite every block from its children so a narrower parent cannot crop them. */
function layoutFromChildren(document: WebsiteDocumentV1, theme: WebsiteTheme | null): WebsiteDocumentV1 {
  let next = document
  for (const breakpoint of FLOW_BREAKPOINTS) {
    let top = 0
    for (const root of [...next.blocks].sort((a, b) => a.zIndex - b.zIndex)) {
      const laid = layoutBlock(next, root.id, breakpoint, theme)
      next = laid.document
      const place = findBlock(next, root.id)?.place
      const col =
        place === 'end'
          ? Math.max(1, 13 - laid.cols)
          : place === 'center'
            ? Math.max(1, Math.floor((12 - laid.cols) / 2) + 1)
            : 1
      next = updateBlockById(next, root.id, (block) => ({
        ...block,
        layout: {
          ...block.layout,
          [breakpoint]: { col, colSpan: laid.cols, top, height: laid.height },
        },
      }))
      top += laid.height
    }
  }
  return fitContainer(next)
}

function fitContainer(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  let bottom = 0
  for (const breakpoint of WEBSITE_BREAKPOINTS) {
    bottom = Math.max(bottom, documentContentHeight(document, breakpoint))
  }
  return { ...document, container: { ...document.container, height: Math.max(1, bottom) } }
}

function lastRootBlockId(document: WebsiteDocumentV1): string | null {
  return document.blocks.at(-1)?.id ?? null
}

function findAddonHostId(blocks: WebsiteBlock[], addonId: string): string | null {
  for (const block of blocks) {
    if (block.addons.some((addon) => addon.id === addonId)) return block.id
    const nested = findAddonHostId(block.children ?? [], addonId)
    if (nested) return nested
  }
  return null
}

function collectTextAddons(block: WebsiteBlock): { blockId: string; addon: Extract<WebsiteAddon, { type: 'text' }> }[] {
  const found: { blockId: string; addon: Extract<WebsiteAddon, { type: 'text' }> }[] = []
  for (const addon of block.addons) {
    if (addon.type === 'text') found.push({ blockId: block.id, addon })
  }
  for (const child of block.children ?? []) found.push(...collectTextAddons(child))
  return found
}

function resolveTextEdit(
  document: WebsiteDocumentV1,
  op: CanvasOp,
): { blockId: string; addon: Extract<WebsiteAddon, { type: 'text' }> } | null {
  if (op.addonId) {
    const blockId = hostBlockId(document, op)
    const addon = blockId ? findBlock(document, blockId)?.addons.find((item) => item.id === op.addonId) : undefined
    if (blockId && addon?.type === 'text') return { blockId, addon }
  }
  const block = op.blockId ? findBlock(document, op.blockId) : undefined
  if (!block) return null
  const texts = collectTextAddons(block)
  const wanted = op.text?.trim()
  const exact = wanted
    ? texts.find((item) => item.addon.type === 'text' && item.addon.props.content.trim() === wanted)
    : undefined
  if (exact) return exact
  return texts.length === 1 ? texts[0]! : texts[0] ?? null
}

function placeBlock(document: WebsiteDocumentV1, blockId: string, place: 'start' | 'center' | 'end'): WebsiteDocumentV1 {
  const parentId = parentBlockId(document.blocks, blockId, null)
  if (parentId === undefined) return document
  const siblings = parentId ? (findBlock(document, parentId)?.children ?? []) : document.blocks
  const moving = siblings.find((block) => block.id === blockId)
  if (!moving) return document
  const rest = [...siblings].sort((a, b) => a.zIndex - b.zIndex).filter((block) => block.id !== blockId)
  const nextSiblings =
    place === 'start' ? [moving, ...rest] : place === 'end' ? [...rest, moving] : [...rest.slice(0, Math.floor(rest.length / 2)), moving, ...rest.slice(Math.floor(rest.length / 2))]
  const reindexed = nextSiblings.map((block, index) => ({
    ...block,
    zIndex: index,
    place: block.id === blockId ? place : block.place,
  }))
  if (!parentId) return { ...document, blocks: reindexed }
  return updateBlockById(document, parentId, (block) => ({ ...block, children: reindexed }))
}

function hostBlockId(document: WebsiteDocumentV1, op: CanvasOp): string | undefined {
  if (op.blockId && findBlock(document, op.blockId)) return op.blockId
  if (op.addonId) return findAddonHostId(document.blocks, op.addonId) ?? undefined
  return undefined
}

function withText(addon: WebsiteAddon, text: string | undefined): WebsiteAddon {
  if (!text) return addon
  if (addon.type === 'text') return { ...addon, props: { ...addon.props, content: text } }
  if (addon.type === 'button') return { ...addon, props: { ...addon.props, label: text } }
  return addon
}

function withMenuItems(addon: WebsiteAddon, items: string[] | undefined): WebsiteAddon {
  if (addon.type !== 'menu' || !items || items.length === 0) return addon
  return {
    ...addon,
    props: { ...addon.props, items: items.map((label) => createMenuItem(label)) },
  }
}

function ensureBlock(document: WebsiteDocumentV1, preferred: string | null): { document: WebsiteDocumentV1; blockId: string | null } {
  if (preferred && findBlock(document, preferred)) {
    return { document, blockId: preferred }
  }
  const next = addBlock(document, null)
  return { document: next, blockId: lastRootBlockId(next) }
}

type GridNode = {
  kind: 'block' | 'addon'
  id: string
  hostBlockId: string | null
  rect: LayoutRect
  limits: LayoutLimits
}

function rectsOverlap(a: LayoutRect, b: LayoutRect): boolean {
  return a.col < b.col + b.colSpan && b.col < a.col + a.colSpan && a.top < b.top + b.height && b.top < a.top + a.height
}

function sameRect(a: LayoutRect, b: LayoutRect): boolean {
  return a.col === b.col && a.colSpan === b.colSpan && a.top === b.top && a.height === b.height
}

function findFreeRect(wanted: LayoutRect, occupied: LayoutRect[]): LayoutRect {
  const startRow = Math.round(wanted.top / ROW_HEIGHT)
  for (let row = startRow; row <= startRow + 80; row += 1) {
    for (let col = 1; col <= 13 - wanted.colSpan; col += 1) {
      const candidate = { col, colSpan: wanted.colSpan, top: row * ROW_HEIGHT, height: wanted.height }
      if (!occupied.some((rect) => rectsOverlap(candidate, rect))) return candidate
    }
  }
  const bottom = occupied.reduce((max, rect) => Math.max(max, rect.top + rect.height), 0)
  return { col: 1, colSpan: wanted.colSpan, top: bottom, height: wanted.height }
}

function interiorNodes(block: WebsiteBlock, breakpoint: WebsiteBreakpoint): GridNode[] {
  const addons = block.addons.map((addon) => ({
    kind: 'addon' as const,
    id: addon.id,
    hostBlockId: block.id,
    rect: resolveLayoutRect(addon.layout, breakpoint),
    limits: ADDON_LAYOUT_LIMITS,
  }))
  const children = (block.children ?? []).map((child) => ({
    kind: 'block' as const,
    id: child.id,
    hostBlockId: block.id,
    rect: resolveLayoutRect(child.layout, breakpoint),
    limits: CONTENT_BLOCK_LAYOUT_LIMITS,
  }))
  return [...addons, ...children]
}

function peerNodes(document: WebsiteDocumentV1, target: GridNode, breakpoint: WebsiteBreakpoint): GridNode[] {
  if (target.kind === 'block' && target.hostBlockId == null) {
    return document.blocks.map((block) => ({
      kind: 'block' as const,
      id: block.id,
      hostBlockId: null,
      rect: resolveLayoutRect(block.layout, breakpoint),
      limits: CONTENT_BLOCK_LAYOUT_LIMITS,
    }))
  }
  const hostId = target.kind === 'addon' ? target.hostBlockId : target.hostBlockId
  const host = hostId ? findBlock(document, hostId) : undefined
  return host ? interiorNodes(host, breakpoint) : []
}

function contentBottom(block: WebsiteBlock, breakpoint: WebsiteBreakpoint): number {
  let bottom = 0
  for (const addon of block.addons) {
    const rect = resolveLayoutRect(addon.layout, breakpoint)
    bottom = Math.max(bottom, rect.top + rect.height)
  }
  for (const child of block.children ?? []) {
    const rect = resolveLayoutRect(child.layout, breakpoint)
    bottom = Math.max(bottom, rect.top + rect.height)
  }
  return bottom
}

function writeRectAll(layout: LayoutByBreakpoint, rect: LayoutRect, limits: LayoutLimits): LayoutByBreakpoint {
  const clamped = clampRect(rect, limits)
  const next: LayoutByBreakpoint = { ...layout }
  const keys = new Set<WebsiteBreakpoint>([...FLOW_BREAKPOINTS, '2xl'])
  for (const key of Object.keys(layout) as WebsiteBreakpoint[]) {
    if (layout[key]) keys.add(key)
  }
  for (const key of keys) next[key] = clamped
  return next
}

function growHeightToChildren(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  return updateBlockById(document, blockId, (block) => {
    const layout: LayoutByBreakpoint = { ...block.layout }
    for (const breakpoint of FLOW_BREAKPOINTS) {
      const current = resolveLayoutRect(layout, breakpoint)
      const bottom = Math.max(current.height, contentBottom(block, breakpoint))
      if (bottom > current.height) layout[breakpoint] = { ...current, height: bottom }
    }
    return { ...block, layout }
  })
}

function growHeightFrom(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  let next = growHeightToChildren(document, blockId)
  let parent = parentBlockId(next.blocks, blockId, null)
  while (parent) {
    next = growHeightToChildren(next, parent)
    parent = parentBlockId(next.blocks, parent, null)
  }
  return next
}

/** Put one block or add-on on the canvas grid and shift anything it would cover. */
function placeOnGrid(document: WebsiteDocumentV1, op: CanvasOp): WebsiteDocumentV1 | null {
  if (op.col == null && op.row == null && op.cols == null && op.rows == null) return null
  const breakpoint = '2xl' as const
  let target: GridNode | null = null
  if (op.addonId) {
    const hostBlockId = findAddonHostId(document.blocks, op.addonId)
    const addon = hostBlockId ? findBlock(document, hostBlockId)?.addons.find((item) => item.id === op.addonId) : undefined
    if (!hostBlockId || !addon) return null
    target = {
      kind: 'addon',
      id: addon.id,
      hostBlockId,
      rect: resolveLayoutRect(addon.layout, breakpoint),
      limits: ADDON_LAYOUT_LIMITS,
    }
  } else if (op.blockId && findBlock(document, op.blockId)) {
    const parentId = parentBlockId(document.blocks, op.blockId, null)
    if (parentId === undefined) return null
    const block = findBlock(document, op.blockId)
    if (!block) return null
    target = {
      kind: 'block',
      id: block.id,
      hostBlockId: parentId,
      rect: resolveLayoutRect(block.layout, breakpoint),
      limits: CONTENT_BLOCK_LAYOUT_LIMITS,
    }
  }
  if (!target) return null

  const requested = clampRect(
    {
      col: op.col ?? target.rect.col,
      colSpan: op.cols ?? target.rect.colSpan,
      top: op.row != null ? op.row * ROW_HEIGHT : target.rect.top,
      height: op.rows != null ? op.rows * ROW_HEIGHT : target.rect.height,
    },
    target.limits,
  )
  if (target.kind === 'block') {
    const block = findBlock(document, target.id)
    if (block) requested.height = Math.max(requested.height, contentBottom(block, breakpoint))
  }

  const peers = peerNodes(document, target, breakpoint)
  const priority = { ...target, rect: requested }
  const rest = peers
    .filter((node) => !(node.kind === target.kind && node.id === target.id))
    .sort((a, b) => a.rect.top - b.rect.top || a.rect.col - b.rect.col)
  const occupied = [requested]
  const settled: GridNode[] = [priority]
  for (const node of rest) {
    const rect = occupied.some((item) => rectsOverlap(node.rect, item)) ? findFreeRect(node.rect, occupied) : node.rect
    occupied.push(rect)
    settled.push({ ...node, rect })
  }

  let next = document
  for (const node of settled) {
    const previous = peers.find((item) => item.kind === node.kind && item.id === node.id)
    if (previous && sameRect(previous.rect, node.rect) && !(node.kind === target.kind && node.id === target.id)) continue
    if (node.kind === 'block') {
      next = updateBlockById(next, node.id, (block) => ({
        ...block,
        layout: writeRectAll(block.layout, node.rect, node.limits),
      }))
      continue
    }
    if (!node.hostBlockId) continue
    const addon = findBlock(next, node.hostBlockId)?.addons.find((item) => item.id === node.id)
    if (!addon) continue
    next = updateAddon(next, node.hostBlockId, { ...addon, layout: writeRectAll(addon.layout, node.rect, node.limits) })
  }

  if (target.kind === 'block' && target.hostBlockId) next = widenParentRow(next, target.hostBlockId)
  if (target.kind === 'addon' && target.hostBlockId) next = growHeightFrom(next, target.hostBlockId)
  else if (target.hostBlockId) next = growHeightFrom(next, target.hostBlockId)
  return fitContainer(next)
}

/** A left column and a right column share one full-width parent row. */
function widenParentRow(document: WebsiteDocumentV1, parentId: string): WebsiteDocumentV1 {
  const parent = findBlock(document, parentId)
  if (!parent || (parent.children ?? []).length < 2) return document
  const rects = (parent.children ?? []).map((child) => resolveLayoutRect(child.layout, '2xl'))
  const left = rects.some((rect) => rect.col === 1)
  const right = rects.some((rect) => rect.col + rect.colSpan - 1 >= 12)
  if (!left || !right) return document
  const current = resolveLayoutRect(parent.layout, '2xl')
  if (current.col === 1 && current.colSpan === 12) return document
  return updateBlockById(document, parentId, (block) => ({
    ...block,
    layout: writeRectAll(block.layout, { ...current, col: 1, colSpan: 12 }, CONTENT_BLOCK_LAYOUT_LIMITS),
  }))
}

export type ApplyCanvasOptions = { theme?: WebsiteTheme | null }

export function applyCanvasOperations(
  document: WebsiteDocumentV1,
  args: Record<string, unknown>,
  options?: ApplyCanvasOptions,
): CanvasApplyResult {
  const theme = options?.theme ?? null
  let next = document
  const preserveExisting = document.blocks.length > 0
  const changeName = typeof args.name === 'string' ? args.name : undefined
  const requestedPlace = alignFromLabel(changeName)
  const touched = new Set<string>()
  const fitTouched = (doc: WebsiteDocumentV1, blockId: string) =>
    preserveExisting ? growFromBlock(doc, blockId) : fitFromBlock(doc, blockId)
  let applied = 0
  const heroImages = new Set<string>()
  let selection: DesignerSelection | null = null
  let pendingBlockId = lastRootBlockId(next)
  let pendingSectionId = pendingBlockId
  let replaceSlot: { blockId: string; index: number } | null = null

  for (const op of readOps(args)) {
    if (op.op !== 'add_addon' && op.op !== 'delete_addon') replaceSlot = null
    if (op.op === 'add_block') {
      const namedParent = op.blockId && findBlock(next, op.blockId) ? op.blockId : null
      const nest = op.group || namedParent != null
      if (!nest) {
        const before = next
        next = addBlock(next, null)
        pendingBlockId = lastRootBlockId(next)
        pendingSectionId = pendingBlockId
        if (pendingBlockId) {
          next = placeNewBlock(before, pendingBlockId, next)
          next = nameBlock(next, pendingBlockId, op.elementName)
          touched.add(pendingBlockId)
          next = fitContainer(next)
          applied += 1
          selection = { kind: 'block', blockId: pendingBlockId }
        }
        continue
      }

      let parentId = namedParent ?? pendingSectionId
      if (!parentId || !findBlock(next, parentId)) {
        const before = next
        next = addBlock(next, null)
        parentId = lastRootBlockId(next)
        if (!parentId) continue
        next = placeNewBlock(before, parentId, next)
        pendingSectionId = parentId
      }
      next = addBlock(next, parentId)
      const childId = findBlock(next, parentId)?.children.at(-1)?.id
      if (!childId) continue
      next = placeChildBlock(next, parentId, childId)
      next = nameBlock(next, childId, op.elementName)
      touched.add(childId)
      next = fitTouched(next, childId)
      const groupSide = op.align ?? headerChromeSide(changeName, op.elementName, undefined)
      if (groupSide) {
        next = preserveExisting ? pinBlockAlign(next, childId, groupSide) : placeBlock(next, childId, groupSide)
      }
      next = fitContainer(next)
      pendingBlockId = childId
      applied += 1
      selection = { kind: 'block', blockId: childId }
      continue
    }

    if (op.op === 'add_addon' && op.type && ADDON_TYPES.has(op.type)) {
      const beforeDocument = next
      const createdBlock = !(op.blockId ?? pendingBlockId) || !findBlock(next, op.blockId ?? pendingBlockId ?? '')
      const ensured = ensureBlock(next, op.blockId ?? pendingBlockId)
      next = ensured.document
      let blockId = ensured.blockId
      if (!blockId) continue
      if (createdBlock) {
        next = placeNewBlock(beforeDocument, blockId, next)
        pendingSectionId = blockId
      }
      const addonSide = op.align ?? headerChromeSide(changeName, op.elementName, op.type)
      let nestedBeside = false
      if (addonSide && parentBlockId(next.blocks, blockId, null) === null) {
        next = addBlock(next, blockId)
        const childId = findBlock(next, blockId)?.children.at(-1)?.id
        if (childId) {
          next = placeChildBlock(next, blockId, childId)
          next = nameBlock(next, childId, op.elementName)
          pendingSectionId = blockId
          blockId = childId
          nestedBeside = true
        }
      } else if (addonSide && parentBlockId(next.blocks, blockId, null)) {
        const host = findBlock(next, blockId)
        if (host && !host.place) {
          next = preserveExisting ? pinBlockAlign(next, blockId, addonSide) : placeBlock(next, blockId, addonSide)
        }
      }
      pendingBlockId = nestedBeside && pendingSectionId ? pendingSectionId : blockId
      const before = findBlock(next, blockId)
      const layout = flowAddonLayout(before?.addons ?? [], op.type, op.text, op.items, op.role, theme)
      const created = createPlacedAddon(op.type as WebsiteAddon['type'], before?.addons.length ?? 0, layout)
      const withContent = withMenuItems(withText(created, op.text), op.items)
      const styled =
        withContent.type === 'text' && (op.role === 'heading' || op.role === 'body')
          ? applyThemeTextRole(theme, withContent, op.role)
          : withContent
      const patched = {
        ...styled,
        name: displayName(op.elementName, op.text ?? op.items?.[0]),
      }
      const slot = replaceSlot?.blockId === blockId ? replaceSlot.index : null
      replaceSlot = null
      next = updateBlockById(next, blockId, (block) => {
        if (slot == null) return { ...block, addons: [...block.addons, patched] }
        const addons = [...block.addons]
        addons.splice(Math.min(slot, addons.length), 0, patched)
        return { ...block, addons }
      })
      const addonId = patched.id
      if (patched.type === 'image' && isHeroImage(changeName, op.elementName, op.span)) heroImages.add(addonId)
      touched.add(blockId)
      next = fitTouched(next, blockId)
      if (nestedBeside && addonSide) {
        next = preserveExisting ? pinBlockAlign(next, blockId, addonSide) : placeBlock(next, blockId, addonSide)
      }
      next = fitContainer(next)
      applied += 1
      selection = { kind: 'addon', blockId, addonId }
      continue
    }

    if (op.op === 'update_block' && op.blockId && (op.html !== undefined || op.styles !== undefined || op.scripts !== undefined)) {
      const current = findBlock(next, op.blockId) ?? findTemplateBlock(next, op.blockId)
      if (!current) continue
      const existing = normalizeWebsiteElementCustomization(current.customization)
      const customization = storedBlockCustomization(
        {
          html: op.html !== undefined ? op.html : existing.html,
          styles: op.styles !== undefined ? op.styles : existing.styles,
          scripts: op.scripts !== undefined ? op.scripts : existing.scripts,
        },
        current.id,
      )
      next = {
        ...next,
        blocks: next.blocks.map((block) =>
          mapBlockInTree(block, current.id, (item) => ({ ...item, customization })),
        ),
      }
      touched.add(current.id)
      applied += 1
      pendingBlockId = current.id
      selection = { kind: 'block', blockId: current.id }
      continue
    }

    if (op.op === 'rename' && op.elementName && (op.addonId || op.blockId)) {
      if (op.addonId) {
        const blockId = findAddonHostId(next.blocks, op.addonId) ?? undefined
        const addon = blockId ? findBlock(next, blockId)?.addons.find((item) => item.id === op.addonId) : undefined
        if (!blockId || !addon) continue
        next = updateAddon(next, blockId, { ...addon, name: op.elementName })
        touched.add(blockId)
        applied += 1
        pendingBlockId = blockId
        selection = { kind: 'addon', blockId, addonId: addon.id }
        continue
      }
      if (op.blockId && findBlock(next, op.blockId)) {
        next = nameBlock(next, op.blockId, op.elementName)
        touched.add(op.blockId)
        applied += 1
        pendingBlockId = op.blockId
        selection = { kind: 'block', blockId: op.blockId }
        continue
      }
      continue
    }

    if (op.op === 'move') {
      const placed = placeOnGrid(next, op)
      if (!placed) continue
      next = placed
      applied += 1
      if (op.addonId) {
        const blockId = findAddonHostId(next.blocks, op.addonId) ?? undefined
        if (blockId) {
          pendingBlockId = blockId
          selection = { kind: 'addon', blockId, addonId: op.addonId }
        }
      } else if (op.blockId) {
        pendingBlockId = op.blockId
        selection = { kind: 'block', blockId: op.blockId }
      }
      continue
    }

    if (op.op === 'place_block' && op.blockId && op.align) {
      if (!findBlock(next, op.blockId)) continue
      next = preserveExisting ? pinBlockAlign(next, op.blockId, op.align) : placeBlock(next, op.blockId, op.align)
      touched.add(op.blockId)
      applied += 1
      pendingBlockId = op.blockId
      selection = { kind: 'block', blockId: op.blockId }
      continue
    }

    if (op.op === 'update_text' && op.text != null && (op.addonId || op.blockId)) {
      const target = resolveTextEdit(next, op)
      let changed = false
      if (target && target.addon.type === 'text') {
        const updated = applyThemeTextRole(
          theme,
          {
            ...target.addon,
            name: op.elementName ?? target.addon.name,
            props: { ...target.addon.props, content: op.text },
          },
          op.role === 'heading' || op.role === 'body' ? op.role : undefined,
        )
        next = updateAddon(next, target.blockId, updated)
        pendingBlockId = target.blockId
        selection = { kind: 'addon', blockId: target.blockId, addonId: target.addon.id }
        touched.add(target.blockId)
        changed = true
      }
      const align = op.align ?? requestedPlace
      const placeId = op.blockId && findBlock(next, op.blockId) ? op.blockId : target?.blockId
      if (align && placeId) {
        next = preserveExisting ? pinBlockAlign(next, placeId, align) : placeBlock(next, placeId, align)
        touched.add(placeId)
        pendingBlockId = placeId
        selection = { kind: 'block', blockId: placeId }
        changed = true
      }
      if (!changed) continue
      applied += 1
      continue
    }

    if (op.op === 'update_button' && op.text && (op.addonId || op.blockId)) {
      const block = op.blockId ? findBlock(next, op.blockId) : undefined
      const hosted = op.addonId ? hostBlockId(next, op) : undefined
      const addon = hosted
        ? findBlock(next, hosted)?.addons.find((item) => item.id === op.addonId)
        : block?.addons.find((item) => item.type === 'button' && (item.props.label === op.text || true))
      const blockId = hosted ?? block?.id
      if (!blockId || addon?.type !== 'button') continue
      next = updateAddon(next, blockId, {
        ...addon,
        name: op.elementName ?? addon.name,
        props: { ...addon.props, label: op.text },
      })
      touched.add(blockId)
      applied += 1
      pendingBlockId = blockId
      selection = { kind: 'addon', blockId, addonId: addon.id }
      continue
    }

    if (op.op === 'update_menu' && op.items && op.items.length > 0) {
      const hostedId = hostBlockId(next, op)
      const hosted = hostedId ? findBlock(next, hostedId)?.addons.find((item) => item.id === op.addonId) : undefined
      const block = op.blockId ? findBlock(next, op.blockId) : undefined
      const menus = block?.addons.filter((item) => item.type === 'menu') ?? []
      const addon = hosted?.type === 'menu' ? hosted : menus.length === 1 ? menus[0] : undefined
      const blockId = hosted?.type === 'menu' ? hostedId : addon ? op.blockId : undefined
      if (!blockId || !addon || addon.type !== 'menu') continue
      next = updateAddon(next, blockId, { ...withMenuItems(addon, op.items), name: op.elementName ?? addon.name })
      touched.add(blockId)
      applied += 1
      pendingBlockId = blockId
      selection = { kind: 'addon', blockId, addonId: addon.id }
      continue
    }

    if (op.op === 'delete_block' && op.blockId && findBlock(next, op.blockId)) {
      next = deleteBlock(next, op.blockId)
      applied += 1
      selection = { kind: 'container' }
      if (pendingBlockId === op.blockId) pendingBlockId = lastRootBlockId(next)
      if (pendingSectionId === op.blockId) pendingSectionId = lastRootBlockId(next)
      continue
    }

    if (op.op === 'delete_addon' && op.addonId) {
      const blockId = hostBlockId(next, op)
      if (!blockId) continue
      const host = findBlock(next, blockId)
      const index = host?.addons.findIndex((item) => item.id === op.addonId) ?? -1
      if (!host || index < 0) continue
      next = deleteAddon(next, blockId, op.addonId)
      replaceSlot = { blockId, index }
      applied += 1
      pendingBlockId = blockId
      selection = { kind: 'block', blockId }
    }
  }

  const finish = (document: WebsiteDocumentV1) => ({
    document: expandHeroImages(balanceEqualHeaderColumns(document, changeName), heroImages),
    applied,
    selection,
  })
  if (!preserveExisting) return finish(layoutFromChildren(next, theme))
  for (const blockId of touched) next = widenForContent(next, blockId, theme)
  return finish(fitContainer(next))
}

function isHeroImage(changeName: string | undefined, label: string | undefined, span: string | undefined): boolean {
  if (span === 'full') return true
  const text = `${changeName ?? ''} ${label ?? ''}`.toLowerCase()
  if (/\bheader\b/.test(text)) return false
  return /\b(hero|banner)\b/.test(text) || (/\bimage\b/.test(text) && /\b(full[\s-]?width|large)\b/.test(text))
}

function heroHeight(breakpoint: WebsiteBreakpoint): number {
  const width = WEBSITE_CANVAS_WIDTH[breakpoint]
  return Math.max(ROW_HEIGHT, Math.round((width * 0.42) / ROW_HEIGHT) * ROW_HEIGHT)
}

/** A home-page hero image fills the page width and stays tall enough to read as a banner. */
function expandHeroImages(document: WebsiteDocumentV1, addonIds: Set<string>): WebsiteDocumentV1 {
  if (addonIds.size === 0) return document
  let next = document
  for (const addonId of addonIds) {
    const hostId = findAddonHostId(next.blocks, addonId)
    const host = hostId ? findBlock(next, hostId) : undefined
    const addon = host?.addons.find((item) => item.id === addonId)
    if (!hostId || !addon || addon.type !== 'image') continue
    const layout = { ...addon.layout }
    for (const breakpoint of FLOW_BREAKPOINTS) {
      layout[breakpoint] = { col: 1, colSpan: 12, top: 0, height: heroHeight(breakpoint) }
    }
    next = updateAddon(next, hostId, { ...addon, layout })
    let current: string | null = hostId
    while (current) {
      const blockId: string = current
      for (const breakpoint of FLOW_BREAKPOINTS) {
        const block = findBlock(next, blockId)
        if (!block) continue
        const rect = resolveLayoutRect(block.layout, breakpoint)
        const height = Math.max(rect.height, heroHeight(breakpoint))
        next = updateBlockById(next, blockId, (item) => ({
          ...item,
          layout: { ...item.layout, [breakpoint]: { ...rect, col: 1, colSpan: 12, height } },
        }))
      }
      const parent = parentBlockId(next.blocks, blockId, null)
      current = parent ?? null
    }
  }
  return fitContainer(next)
}

/** A header row with a left block and a right block shares the width evenly. */
function balanceEqualHeaderColumns(document: WebsiteDocumentV1, changeName: string | undefined): WebsiteDocumentV1 {
  if (!changeName || !/\bheader\b/i.test(changeName)) return document
  let next = document
  for (const section of collectBlocks(next.blocks)) {
    const children = section.children ?? []
    if (children.length !== 2) continue
    const left = children.find((child) => child.place === 'start')
    const right = children.find((child) => child.place === 'end')
    if (!left || !right) continue
    for (const breakpoint of FLOW_BREAKPOINTS) {
      const leftRect = resolveLayoutRect(findBlock(next, left.id)?.layout ?? left.layout, breakpoint)
      const rightRect = resolveLayoutRect(findBlock(next, right.id)?.layout ?? right.layout, breakpoint)
      const height = Math.max(leftRect.height, rightRect.height, 1)
      next = updateBlockById(next, left.id, (block) => ({
        ...block,
        layout: { ...block.layout, [breakpoint]: { col: 1, colSpan: 6, top: 0, height } },
      }))
      next = updateBlockById(next, right.id, (block) => ({
        ...block,
        layout: { ...block.layout, [breakpoint]: { col: 7, colSpan: 6, top: 0, height } },
      }))
      const parentRect = resolveLayoutRect(findBlock(next, section.id)?.layout ?? section.layout, breakpoint)
      next = updateBlockById(next, section.id, (block) => ({
        ...block,
        layout: { ...block.layout, [breakpoint]: { ...parentRect, col: 1, colSpan: 12, height } },
      }))
    }
  }
  return fitContainer(next)
}

function collectBlocks(blocks: WebsiteBlock[]): WebsiteBlock[] {
  const all: WebsiteBlock[] = []
  for (const block of blocks) {
    all.push(block)
    if (block.children?.length) all.push(...collectBlocks(block.children))
  }
  return all
}

function gridLabel(layout: LayoutByBreakpoint): string {
  const rect = resolveLayoutRect(layout, '2xl')
  const row = Math.round(rect.top / ROW_HEIGHT)
  const rows = Math.max(1, Math.round(rect.height / ROW_HEIGHT))
  return `col ${rect.col} cols ${rect.colSpan} row ${row} rows ${rows}`
}

function addonDetail(addon: WebsiteAddon): string {
  if (addon.type === 'text') return addon.props.content ? `: ${addon.props.content.slice(0, 80)}` : ''
  if (addon.type === 'button') return addon.props.label ? `: ${addon.props.label}` : ''
  if (addon.type === 'menu') {
    const labels = addon.props.items.map((item) => item.label).filter(Boolean)
    return labels.length > 0 ? `: ${labels.join(', ')}` : ''
  }
  return ''
}

function outlineBlocks(blocks: WebsiteBlock[], indent: string): string[] {
  const lines: string[] = []
  for (const block of blocks) {
    const blockName = block.name?.trim()
    lines.push(`${indent}- block ${block.id}${blockName ? ` "${blockName}"` : ''} ${gridLabel(block.layout)}`)
    const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
    for (const addon of addons) {
      const addonName = addon.name?.trim()
      lines.push(
        `${indent}  - ${addon.type} ${addon.id}${addonName ? ` "${addonName}"` : ''}${addonDetail(addon)} ${gridLabel(addon.layout)}`,
      )
    }
    if (block.children.length > 0) {
      lines.push(...outlineBlocks(block.children, `${indent}  `))
    }
  }
  return lines
}

function findTemplateBlock(document: WebsiteDocumentV1, blockId: string): WebsiteBlock | null {
  function walk(blocks: WebsiteBlock[]): WebsiteBlock | null {
    for (const block of blocks) {
      for (const addon of block.addons) {
        if (addon.type !== 'slider' || !addon.props.slideTemplate) continue
        const found = findBlockInTree(addon.props.slideTemplate, blockId)
        if (found) return found
      }
      const nested = walk(block.children ?? [])
      if (nested) return nested
    }
    return null
  }
  return walk(document.blocks)
}

function blockShellLines(block: WebsiteBlock): string[] {
  const customization = normalizeWebsiteElementCustomization(block.customization)
  const html = effectiveElementHtml(customization, defaultElementHtml('block', block.id))
  const styles = effectiveElementStyles(customization, defaultElementStyles(block.id), block.id)
  return [
    `Block shell for ${block.id}. update_block edits this block only.`,
    'html is the block shell. Keep {{children}} where nested blocks and add-ons render. Do not paste child or addon markup into html.',
    `html: ${html}`,
    `styles: ${styles}`,
    `scripts: ${customization.scripts}`,
  ]
}

function focusedShellBlock(
  document: WebsiteDocumentV1,
  focus: DesignerSelection | null | undefined,
): WebsiteBlock | null {
  if (!focus || focus.kind === 'container' || focus.kind === 'addon' || focus.kind === 'templateAddon') return null
  if (focus.kind === 'block') return findBlock(document, focus.blockId)
  const slider = findBlock(document, focus.hostBlockId)?.addons.find((addon) => addon.id === focus.sliderAddonId)
  if (!slider || slider.type !== 'slider' || !slider.props.slideTemplate) return null
  return findBlockInTree(slider.props.slideTemplate, focus.templateBlockId)
}

function canvasFocusLine(focus: DesignerSelection | null | undefined): string | null {
  if (!focus || focus.kind === 'container') return null
  if (focus.kind === 'block') return `block ${focus.blockId}`
  if (focus.kind === 'addon') return `addon ${focus.addonId} in block ${focus.blockId}`
  if (focus.kind === 'templateBlock') {
    return `slide template block ${focus.templateBlockId} in slider ${focus.sliderAddonId} on block ${focus.hostBlockId}`
  }
  return `slide template addon ${focus.templateAddonId} in template block ${focus.templateBlockId} in slider ${focus.sliderAddonId} on block ${focus.hostBlockId}`
}

export function formatDesignerCanvasContext(input: {
  kind: string
  id: string
  name: string
  document: WebsiteDocumentV1
  theme?: WebsiteTheme | null
  focus?: DesignerSelection | null
}): string {
  const blocks = outlineBlocks(input.document.blocks, '')
  const body = blocks.length > 0 ? blocks.join('\n') : '(empty canvas)'
  const focus = canvasFocusLine(input.focus)
  const shellBlock = focusedShellBlock(input.document, input.focus)
  const shell = shellBlock ? blockShellLines(shellBlock) : []
  return [
    '[designer-canvas]',
    `kind: ${input.kind}`,
    `id: ${input.id}`,
    `name: ${input.name}`,
    'This canvas is a page, header, footer, or preset. Use the same tool for all of them: apply_design_canvas when it is available, otherwise apply_design_library_canvas.',
    'Copy block and addon ids from this outline. Never invent ids.',
    focus
      ? `The user copied this element into the assistant. Change this element unless they name a different one: ${focus}.`
      : 'No element was copied. Ask which element to change when the request is ambiguous.',
    'This outline is the canvas right now, including every change the user made by hand. Ignore any earlier designer-canvas outline. Edit these ids in place. Do not recreate a block that is already listed, and do not change text, items, or positions you were not asked to change.',
    'Create with add_block and add_addon. add_addon type is text, button, image, slider, or menu. group true nests a block in the current section. rename, update_text, update_button, update_menu, and update_block edit an existing id. update_block sets html, styles, and scripts for that block shell only. Keep {{children}} in html. Do not paste child or addon markup into html. move uses col, row, cols, and rows from this outline. place_block align is start, center, or end. delete_block and delete_addon remove an existing id. Do not recreate an element to rename it. Do not name an element Block, Text, Button, Image, Slider, or Menu. Set role heading on every title and role body on paragraphs — this applies the active theme text styles (font size, font, color). span full is only for a wide image.',
    ...formatThemeTextStylesForAssistant(input.theme ?? null),
    ...shell,
    'Do not create a new page, header, footer, preset, layout, or theme unless the user asked for a new record.',
    'Images have no media until the user picks one. Do not invent media ids.',
    'blocks:',
    body,
    '[/designer-canvas]',
  ].join('\n')
}

const CANVAS_PREFIX = /^\[designer-canvas\][\s\S]*?\[\/designer-canvas\]\s*/

export function visibleDesignerChatText(content: string): string {
  return content.replace(CANVAS_PREFIX, '').trim()
}
