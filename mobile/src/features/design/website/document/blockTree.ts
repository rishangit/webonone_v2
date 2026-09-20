import { nanoid } from '@/features/design/website/nanoid'
import { DEFAULT_CONTENT_BLOCK_COL_SPAN, DEFAULT_CONTENT_BLOCK_HEIGHT, ROW_HEIGHT } from './layout'
import { emptyLayoutByBreakpoint, WEBSITE_BREAKPOINTS } from '../types'
import type { LayoutByBreakpoint, MenuItem, WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../types'

export function slugifyGroupName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function mapBlocks(blocks: WebsiteBlock[], fn: (block: WebsiteBlock) => WebsiteBlock): WebsiteBlock[] {
  return blocks.map((block) => {
    const next = fn({
      ...block,
      children: mapBlocks(block.children ?? [], fn),
    })
    return next
  })
}

export function findBlock(document: WebsiteDocumentV1, blockId: string): WebsiteBlock | null {
  return findBlockInList(document.blocks, blockId)
}

/** Ancestors from root to the target block (inclusive). Empty if not found. */
export function findBlockPath(document: WebsiteDocumentV1, blockId: string): WebsiteBlock[] {
  const path: WebsiteBlock[] = []
  if (findBlockPathInList(document.blocks, blockId, path)) return path
  return []
}

function findBlockPathInList(blocks: WebsiteBlock[], blockId: string, path: WebsiteBlock[]): boolean {
  for (const block of blocks) {
    path.push(block)
    if (block.id === blockId) return true
    if (findBlockPathInList(block.children ?? [], blockId, path)) return true
    path.pop()
  }
  return false
}

function findBlockInList(blocks: WebsiteBlock[], blockId: string): WebsiteBlock | null {
  for (const block of blocks) {
    if (block.id === blockId) return block
    const nested = findBlockInList(block.children ?? [], blockId)
    if (nested) return nested
  }
  return null
}

/** Depth of the block (root = 1). Returns 0 when not found. */
export function blockDepth(document: WebsiteDocumentV1, blockId: string): number {
  return blockDepthInList(document.blocks, blockId, 1)
}

function blockDepthInList(blocks: WebsiteBlock[], blockId: string, depth: number): number {
  for (const block of blocks) {
    if (block.id === blockId) return depth
    const nested = blockDepthInList(block.children ?? [], blockId, depth + 1)
    if (nested > 0) return nested
  }
  return 0
}

export function updateBlockById(
  document: WebsiteDocumentV1,
  blockId: string,
  updater: (block: WebsiteBlock) => WebsiteBlock,
): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: updateBlockInList(document.blocks, blockId, updater),
  }
}

function updateBlockInList(
  blocks: WebsiteBlock[],
  blockId: string,
  updater: (block: WebsiteBlock) => WebsiteBlock,
): WebsiteBlock[] {
  return blocks.map((block) => {
    if (block.id === blockId) return updater(block)
    return {
      ...block,
      children: updateBlockInList(block.children ?? [], blockId, updater),
    }
  })
}

function createEmptyBlock(zIndex: number, top: number): WebsiteBlock {
  return {
    id: nanoid(10),
    zIndex,
    layout: emptyLayoutByBreakpoint({
      col: 1,
      colSpan: DEFAULT_CONTENT_BLOCK_COL_SPAN,
      top,
      height: DEFAULT_CONTENT_BLOCK_HEIGHT,
    }),
    addons: [],
    children: [],
  }
}

export function addBlock(document: WebsiteDocumentV1, parentBlockId?: string | null): WebsiteDocumentV1 {
  if (!parentBlockId) {
    const top = 16 + document.blocks.length * 24
    const height = DEFAULT_CONTENT_BLOCK_HEIGHT
    const block = createEmptyBlock(document.blocks.length, top)
    const containerHeight = Math.max(document.container.height, top + height + 16)
    return {
      ...document,
      container: { ...document.container, height: containerHeight },
      blocks: [...document.blocks, block],
    }
  }

  const parent = findBlock(document, parentBlockId)
  if (!parent) return document
  const children = [...(parent.children ?? [])]
  const top = 16 + children.length * 24
  const child = createEmptyBlock(children.length, top)
  return updateBlockById(document, parentBlockId, (block) => ({
    ...block,
    children: [...(block.children ?? []), child],
  }))
}

function remintMenuItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    id: nanoid(10),
    children: remintMenuItems(item.children),
  }))
}

/** Keep nested slide templates (parent-path galleries); remint happens in cloneBlockTree. */
export function stripNestedSliders(block: WebsiteBlock): WebsiteBlock {
  return {
    ...block,
    addons: (block.addons ?? []).map((addon) => {
      if (addon.type !== 'slider' || !addon.props.slideTemplate) return addon
      return {
        ...addon,
        props: {
          ...addon.props,
          slideTemplate: stripNestedSliders(addon.props.slideTemplate),
        },
      }
    }),
    children: (block.children ?? []).map(stripNestedSliders),
  }
}

function cloneAddon(addon: WebsiteAddon, zIndex: number): WebsiteAddon {
  const cloned = structuredClone(addon) as WebsiteAddon
  cloned.id = nanoid(10)
  cloned.zIndex = zIndex
  if (cloned.type === 'menu') {
    cloned.props = { ...cloned.props, items: remintMenuItems(cloned.props.items) }
  }
  if (cloned.type === 'slider') {
    cloned.props = {
      ...cloned.props,
      slideTemplate: cloned.props.slideTemplate
        ? stripNestedSliders(cloneBlockTree(cloned.props.slideTemplate, 0, null))
        : null,
      manualSlides: cloned.props.manualSlides.map((slide) => ({
        ...structuredClone(slide),
        id: nanoid(10),
      })),
    }
  }
  return cloned
}

export function cloneBlockTree(
  block: WebsiteBlock,
  zIndex: number,
  allowedTypes: Set<WebsiteAddon['type']> | null,
): WebsiteBlock {
  const addons = [...(block.addons ?? [])]
    .sort((a, b) => a.zIndex - b.zIndex)
    .filter((addon) => !allowedTypes || allowedTypes.has(addon.type))
    .map((addon, index) => cloneAddon(addon, index))
  const children = [...(block.children ?? [])]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((child, index) => cloneBlockTree(child, index, allowedTypes))
  return {
    ...structuredClone({
      id: block.id,
      zIndex: block.zIndex,
      backgroundColor: block.backgroundColor,
      borderColor: block.borderColor,
      borderRadius: block.borderRadius,
      boxShadow: block.boxShadow,
      padding: block.padding,
      margin: block.margin,
      groupName: block.groupName,
      dataBinding: block.dataBinding,
      layout: block.layout,
    }),
    id: nanoid(10),
    zIndex,
    addons,
    children,
  }
}

/** Bump every present breakpoint `top` so a duplicate sits just below the source. */
export function offsetLayoutNear(layout: LayoutByBreakpoint): LayoutByBreakpoint {
  const next: LayoutByBreakpoint = { ...layout, '2xl': { ...layout['2xl'], top: layout['2xl'].top + ROW_HEIGHT } }
  for (const bp of WEBSITE_BREAKPOINTS) {
    if (bp === '2xl') continue
    const rect = layout[bp]
    if (rect) next[bp] = { ...rect, top: rect.top + ROW_HEIGHT }
  }
  return next
}

export type DuplicateResult = { document: WebsiteDocumentV1; id: string }

function insertSiblingBlock(
  siblings: WebsiteBlock[],
  sourceId: string,
  clone: WebsiteBlock,
): WebsiteBlock[] | null {
  const sorted = [...siblings].sort((a, b) => a.zIndex - b.zIndex)
  const index = sorted.findIndex((item) => item.id === sourceId)
  if (index < 0) return null
  sorted.splice(index + 1, 0, clone)
  return sorted.map((item, i) => ({ ...item, zIndex: i }))
}

export function duplicateBlock(document: WebsiteDocumentV1, blockId: string): DuplicateResult | null {
  const path = findBlockPath(document, blockId)
  const source = path.at(-1)
  if (!source) return null

  const clone = {
    ...cloneBlockTree(source, source.zIndex + 1, null),
    layout: offsetLayoutNear(source.layout),
  }

  if (path.length === 1) {
    const blocks = insertSiblingBlock(document.blocks, blockId, clone)
    if (!blocks) return null
    const rect = clone.layout['2xl']
    const bottom = (rect?.top ?? 0) + (rect?.height ?? DEFAULT_CONTENT_BLOCK_HEIGHT) + 16
    return {
      id: clone.id,
      document: {
        ...document,
        container: {
          ...document.container,
          height: Math.max(document.container.height, bottom),
        },
        blocks,
      },
    }
  }

  const parent = path.at(-2)
  if (!parent) return null
  const children = insertSiblingBlock(parent.children ?? [], blockId, clone)
  if (!children) return null
  return {
    id: clone.id,
    document: updateBlockById(document, parent.id, (block) => ({ ...block, children })),
  }
}

export function duplicateAddon(
  document: WebsiteDocumentV1,
  blockId: string,
  addonId: string,
): DuplicateResult | null {
  const host = findBlock(document, blockId)
  if (!host) return null
  const sorted = [...host.addons].sort((a, b) => a.zIndex - b.zIndex)
  const index = sorted.findIndex((item) => item.id === addonId)
  const source = sorted[index]
  if (!source) return null

  const clone = {
    ...cloneAddon(source, source.zIndex + 1),
    layout: offsetLayoutNear(source.layout),
  }
  sorted.splice(index + 1, 0, clone)
  const addons = sorted.map((item, i) => ({ ...item, zIndex: i }))
  return {
    id: clone.id,
    document: updateBlockById(document, blockId, (block) => ({ ...block, addons })),
  }
}

export function documentFromBlock(block: WebsiteBlock): WebsiteDocumentV1 {
  const next = cloneBlockTree(block, 0, null)
  const rect = next.layout['2xl']
  const height = Math.max(
    DEFAULT_CONTENT_BLOCK_HEIGHT + 32,
    (rect?.top ?? 0) + (rect?.height ?? DEFAULT_CONTENT_BLOCK_HEIGHT) + 16,
  )
  return {
    version: 1,
    container: { height },
    blocks: [next],
  }
}

export function insertBlocksFromPreset(
  document: WebsiteDocumentV1,
  parentBlockId: string | null,
  presetDocument: WebsiteDocumentV1,
  allowedTypes: Set<WebsiteAddon['type']> | null = null,
  presetName?: string | null,
): WebsiteDocumentV1 {
  const groupStamp = presetName ? slugifyGroupName(presetName) : ''
  const incoming = [...presetDocument.blocks]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((block, index) => {
      const cloned = cloneBlockTree(block, index, allowedTypes)
      if (!groupStamp || cloned.groupName?.trim()) return cloned
      return { ...cloned, groupName: groupStamp }
    })
  if (incoming.length === 0) return document

  if (!parentBlockId) {
    const existing = [...document.blocks]
    const cloned = incoming.map((block, index) => ({
      ...block,
      zIndex: existing.length + index,
    }))
    const last = cloned.at(-1)
    const rect = last?.layout['2xl']
    const bottom = (rect?.top ?? 16) + (rect?.height ?? DEFAULT_CONTENT_BLOCK_HEIGHT) + 16
    return {
      ...document,
      container: {
        ...document.container,
        height: Math.max(document.container.height, bottom),
      },
      blocks: [...existing, ...cloned],
    }
  }

  return updateBlockById(document, parentBlockId, (block) => {
    const existing = [...(block.children ?? [])]
    const cloned = incoming.map((child, index) => ({
      ...child,
      zIndex: existing.length + index,
    }))
    return { ...block, children: [...existing, ...cloned] }
  })
}

export function deleteBlock(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: deleteBlockInList(document.blocks, blockId),
  }
}

function deleteBlockInList(blocks: WebsiteBlock[], blockId: string): WebsiteBlock[] {
  const filtered = blocks.filter((block) => block.id !== blockId)
  if (filtered.length !== blocks.length) {
    return filtered.map((block, index) => ({ ...block, zIndex: index }))
  }
  return blocks.map((block) => ({
    ...block,
    children: deleteBlockInList(block.children ?? [], blockId),
  }))
}

export function deleteAddon(document: WebsiteDocumentV1, blockId: string, addonId: string): WebsiteDocumentV1 {
  return updateBlockById(document, blockId, (block) => ({
    ...block,
    addons: block.addons.filter((addon) => addon.id !== addonId),
  }))
}

export function updateAddon(
  document: WebsiteDocumentV1,
  blockId: string,
  addon: WebsiteAddon,
): WebsiteDocumentV1 {
  return updateBlockById(document, blockId, (block) => ({
    ...block,
    addons: block.addons.map((item) => (item.id === addon.id ? addon : item)),
  }))
}

export function reorderAddons(
  document: WebsiteDocumentV1,
  blockId: string,
  fromIndex: number,
  toIndex: number,
): WebsiteDocumentV1 {
  return updateBlockById(document, blockId, (block) => {
    const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
    const [moved] = addons.splice(fromIndex, 1)
    if (!moved) return block
    addons.splice(toIndex, 0, moved)
    return { ...block, addons: addons.map((item, index) => ({ ...item, zIndex: index })) }
  })
}

export function reorderBlocks(
  document: WebsiteDocumentV1,
  fromIndex: number,
  toIndex: number,
  parentBlockId?: string | null,
): WebsiteDocumentV1 {
  if (!parentBlockId) {
    const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)
    const [moved] = blocks.splice(fromIndex, 1)
    if (!moved) return document
    blocks.splice(toIndex, 0, moved)
    return { ...document, blocks: blocks.map((block, index) => ({ ...block, zIndex: index })) }
  }

  return updateBlockById(document, parentBlockId, (block) => {
    const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
    const [moved] = children.splice(fromIndex, 1)
    if (!moved) return block
    children.splice(toIndex, 0, moved)
    return { ...block, children: children.map((child, index) => ({ ...child, zIndex: index })) }
  })
}

export function changeLayer(
  document: WebsiteDocumentV1,
  target: { blockId: string; addonId?: string },
  direction: 'up' | 'down',
): WebsiteDocumentV1 {
  if (target.addonId) {
    return updateBlockById(document, target.blockId, (block) => ({
      ...block,
      addons: shiftLayer(block.addons, target.addonId!, direction),
    }))
  }

  const siblingResult = shiftBlockAmongSiblings(document.blocks, target.blockId, direction)
  if (siblingResult.changed) {
    return { ...document, blocks: siblingResult.blocks }
  }

  return {
    ...document,
    blocks: shiftNestedBlockLayer(document.blocks, target.blockId, direction),
  }
}

function shiftNestedBlockLayer(
  blocks: WebsiteBlock[],
  blockId: string,
  direction: 'up' | 'down',
): WebsiteBlock[] {
  return blocks.map((block) => {
    const siblingResult = shiftBlockAmongSiblings(block.children ?? [], blockId, direction)
    if (siblingResult.changed) {
      return { ...block, children: siblingResult.blocks }
    }
    return {
      ...block,
      children: shiftNestedBlockLayer(block.children ?? [], blockId, direction),
    }
  })
}

function shiftBlockAmongSiblings(
  blocks: WebsiteBlock[],
  blockId: string,
  direction: 'up' | 'down',
): { blocks: WebsiteBlock[]; changed: boolean } {
  const index = blocks.findIndex((item) => item.id === blockId)
  if (index < 0) return { blocks, changed: false }
  const shifted = shiftLayer(blocks, blockId, direction)
  const changed = shifted.some((item, i) => item.zIndex !== blocks[i]?.zIndex || item.id !== blocks[i]?.id)
  return { blocks: shifted, changed }
}

function shiftLayer<T extends { id: string; zIndex: number }>(items: T[], id: string, direction: 'up' | 'down'): T[] {
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex)
  const index = sorted.findIndex((item) => item.id === id)
  if (index < 0) return items
  const swapWith = direction === 'up' ? index + 1 : index - 1
  if (swapWith < 0 || swapWith >= sorted.length) return items
  const current = sorted[index]
  const other = sorted[swapWith]
  if (!current || !other) return items
  const currentZ = current.zIndex
  return sorted.map((item) => {
    if (item.id === current.id) return { ...item, zIndex: other.zIndex }
    if (item.id === other.id) return { ...item, zIndex: currentZ }
    return item
  })
}
