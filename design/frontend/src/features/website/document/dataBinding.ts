import type {
  LayoutByBreakpoint,
  LayoutRect,
  MediaRef,
  WebsiteAddon,
  WebsiteBlock,
  WebsiteDocumentV1,
} from '../types'
import { WEBSITE_BREAKPOINTS } from '../types'
import { cloneBlockTree } from './blockTree'
import { resolveLayoutRect, ROW_HEIGHT } from './layout'

export { slugifyGroupName } from './blockTree'

export const ADDON_BINDABLE_PROP_KEYS: Record<WebsiteAddon['type'], readonly string[]> = {
  text: ['content'],
  button: ['label'],
  image: ['media'],
  slider: [],
  menu: [],
}

function collectFromBlocks(blocks: WebsiteBlock[], into: Set<string>) {
  for (const block of blocks) {
    const datasetId = block.dataBinding?.datasetId
    if (datasetId) into.add(datasetId)
    for (const addon of block.addons ?? []) {
      if (addon.type === 'slider' && addon.props.dataSource === 'dataset' && addon.props.datasetId) {
        into.add(addon.props.datasetId)
      }
    }
    collectFromBlocks(block.children ?? [], into)
  }
}

export function collectBoundDatasetIds(document: WebsiteDocumentV1): string[] {
  const ids = new Set<string>()
  collectFromBlocks(document.blocks, ids)
  return [...ids]
}

function getByPath(item: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined
  const parts = path.split('.')
  let current: unknown = item
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/** Read a dotted path from a data row (shared with slider parent-path binding). */
export function getDataItemByPath(item: Record<string, unknown>, path: string): unknown {
  const direct = getByPath(item, path)
  if (direct !== undefined) return direct
  // Absolute dataset path on an already-scoped nested row (e.g. galleryImages.url on { url }).
  let rest = path
  while (rest.includes('.')) {
    rest = rest.slice(rest.indexOf('.') + 1)
    if (!rest) break
    const first = rest.split('.')[0]!
    if (Object.prototype.hasOwnProperty.call(item, first)) {
      return getByPath(item, rest)
    }
  }
  return undefined
}

/** Normalize a parent-row property value into list rows for expand / parent-path sliders. */
export function itemsFromDataValue(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        return entry as Record<string, unknown>
      }
      return { value: entry }
    })
  }
  if (value && typeof value === 'object') {
    return [value as Record<string, unknown>]
  }
  if (value == null) return []
  return [{ value }]
}

/**
 * Data row visible to this block's addons/children.
 * Object `itemsPath` scopes to that nested object; arrays keep the parent row
 * (list owners read the array separately via `itemsFromDataValue`).
 */
export function resolveBlockDataItem(
  block: WebsiteBlock,
  parentItem: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!parentItem) return null
  const path = block.dataBinding?.itemsPath?.trim()
  if (!path) return parentItem
  const value = getByPath(parentItem, path)
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return parentItem
}

/** Resolve list rows for a block owner (dataset id or inherited itemsPath). */
export function resolveBlockListItems(
  block: WebsiteBlock,
  parentItem: Record<string, unknown> | null | undefined,
  datasetItemsById: Record<string, Record<string, unknown>[]>,
): Record<string, unknown>[] {
  const binding = block.dataBinding
  if (!binding) return []
  if (binding.datasetId) return datasetItemsById[binding.datasetId] ?? []
  const path = binding.itemsPath?.trim()
  if (path && parentItem) return itemsFromDataValue(getByPath(parentItem, path))
  return []
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function mediaRefFromUnknown(value: unknown): MediaRef | null {
  if (typeof value === 'string' && value.trim()) {
    return { fileId: 'dataset', url: value.trim() }
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const url = asString(record.url) ?? asString(record.src)
    const fileId =
      asString(record.fileId) ?? asString(record.mediaId) ?? asString(record.id) ?? 'dataset'
    const fileName = asString(record.fileName) ?? asString(record.name)
    const mimeType = asString(record.mimeType)
    if (url) {
      return { fileId, url, fileName, mimeType }
    }
    // Catalog gallery entries often store mediaId without a hydrated url.
    if (fileId && fileId !== 'dataset') {
      return { fileId, url: '', fileName, mimeType }
    }
  }
  return null
}

function mediaByBreakpointFromRef(media: MediaRef): Partial<Record<(typeof WEBSITE_BREAKPOINTS)[number], MediaRef>> {
  const next: Partial<Record<(typeof WEBSITE_BREAKPOINTS)[number], MediaRef>> = {}
  for (const breakpoint of WEBSITE_BREAKPOINTS) {
    next[breakpoint] = media
  }
  return next
}

function firstMediaFromValue(value: unknown): MediaRef | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const media = mediaRefFromUnknown(entry)
      if (media) return media
    }
    return null
  }
  return mediaRefFromUnknown(value)
}

function offsetLayout(layout: LayoutByBreakpoint, deltaTop: number): LayoutByBreakpoint {
  const next: LayoutByBreakpoint = { '2xl': offsetRect(layout['2xl'], deltaTop) }
  for (const key of ['sm', 'md', 'lg', 'xl'] as const) {
    const rect = layout[key]
    if (rect) next[key] = offsetRect(rect, deltaTop)
  }
  return next
}

function offsetRect(rect: LayoutRect, deltaTop: number): LayoutRect {
  return { ...rect, top: Math.max(0, rect.top + deltaTop) }
}

function offsetBlockTreeTops(block: WebsiteBlock, deltaTop: number): WebsiteBlock {
  return {
    ...block,
    layout: offsetLayout(block.layout, deltaTop),
    children: (block.children ?? []).map((child) => offsetBlockTreeTops(child, deltaTop)),
  }
}

export type ExpandBoundBlocksResult = {
  block: WebsiteBlock
  /** Maps expanded clone block ids (and nested ids under them) to the dataset row. */
  dataItemByBlockId: Record<string, Record<string, unknown>>
}

function stampDataItemMap(
  block: WebsiteBlock,
  item: Record<string, unknown>,
  into: Record<string, Record<string, unknown>>,
) {
  into[block.id] = item
  for (const child of block.children ?? []) stampDataItemMap(child, item, into)
}

export function expandBoundBlocks(
  block: WebsiteBlock,
  items: Record<string, unknown>[],
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = '2xl',
): ExpandBoundBlocksResult {
  const binding = block.dataBinding
  const itemGroup = binding?.itemGroup?.trim()
  const canOwnList = Boolean(binding?.datasetId || binding?.itemsPath?.trim())
  if (!canOwnList || !itemGroup) {
    return { block, dataItemByBlockId: {} }
  }

  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const templateIndex = children.findIndex((child) => child.groupName === itemGroup)
  if (templateIndex < 0) {
    return { block, dataItemByBlockId: {} }
  }

  const template = children[templateIndex]!
  const staticBefore = children.slice(0, templateIndex)
  const staticAfter = children.slice(templateIndex + 1)
  const templateRect = resolveLayoutRect(template.layout, breakpoint)
  const gap = binding?.itemGap ?? 0
  const stride = templateRect.height + gap
  const dataItemByBlockId: Record<string, Record<string, unknown>> = {}

  const clones = items.map((item, index) => {
    const cloned = cloneBlockTree(template, templateIndex + index, null)
    const withOffset = index === 0 ? cloned : offsetBlockTreeTops(cloned, index * stride)
    stampDataItemMap(withOffset, item, dataItemByBlockId)
    return withOffset
  })

  const expandedChildren = [
    ...staticBefore,
    ...clones.map((clone, index) => ({
      ...clone,
      zIndex: staticBefore.length + index,
    })),
    ...staticAfter.map((child, index) => ({
      ...child,
      zIndex: staticBefore.length + clones.length + index,
    })),
  ]

  const lastClone = clones.at(-1)
  const neededHeight = lastClone
    ? resolveLayoutRect(lastClone.layout, breakpoint).top +
      resolveLayoutRect(lastClone.layout, breakpoint).height +
      16
    : resolveLayoutRect(block.layout, breakpoint).height

  return {
    block: {
      ...block,
      layout: {
        ...block.layout,
        '2xl': {
          ...block.layout['2xl'],
          height: Math.max(block.layout['2xl'].height, neededHeight, ROW_HEIGHT),
        },
      },
      children: expandedChildren,
    },
    dataItemByBlockId,
  }
}

export function resolveAddonProps(addon: WebsiteAddon, dataItem: Record<string, unknown> | null): WebsiteAddon {
  if (!dataItem || !addon.dataBinding?.fields) return addon
  const fields = addon.dataBinding.fields
  if (Object.keys(fields).length === 0) return addon

  if (addon.type === 'text') {
    const path = fields.content
    if (!path) return addon
    const value = asString(getDataItemByPath(dataItem, path))
    if (value == null) return addon
    return { ...addon, props: { ...addon.props, content: value } }
  }

  if (addon.type === 'button') {
    const path = fields.label
    if (!path) return addon
    const value = asString(getDataItemByPath(dataItem, path))
    if (value == null) return addon
    return { ...addon, props: { ...addon.props, label: value } }
  }

  if (addon.type === 'image') {
    const path = fields.media
    if (!path) return addon
    const media = firstMediaFromValue(getDataItemByPath(dataItem, path))
    if (!media) {
      return {
        ...addon,
        props: {
          ...addon.props,
          // Clear stale/default media so the canvas can show the empty ImagePreview.
          mediaByBreakpoint: {},
        },
      }
    }
    return {
      ...addon,
      props: {
        ...addon.props,
        // Overwrite every breakpoint — leaving md/lg/xl stale keeps the default image.
        mediaByBreakpoint: mediaByBreakpointFromRef(media),
      },
    }
  }

  return addon
}

export function findNearestDatasetBinding(
  path: WebsiteBlock[],
): { block: WebsiteBlock; datasetId: string } | null {
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const block = path[i]!
    const datasetId = block.dataBinding?.datasetId
    if (datasetId) return { block, datasetId }
  }
  return null
}

export function childGroupNames(block: WebsiteBlock): string[] {
  const names = new Set<string>()
  for (const child of block.children ?? []) {
    const name = child.groupName?.trim()
    if (name) names.add(name)
  }
  return [...names].sort()
}

export function expandDocumentForPublish(
  document: WebsiteDocumentV1,
  datasetItemsById: Record<string, Record<string, unknown>[]>,
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = '2xl',
): { document: WebsiteDocumentV1; dataItemByBlockId: Record<string, Record<string, unknown>> } {
  const dataItemByBlockId: Record<string, Record<string, unknown>> = {}

  function expandList(
    blocks: WebsiteBlock[],
    parentItem: Record<string, unknown> | null,
  ): WebsiteBlock[] {
    return blocks.map((block) => {
      const items = resolveBlockListItems(block, parentItem, datasetItemsById)
      const expanded = expandBoundBlocks(block, items, breakpoint)
      Object.assign(dataItemByBlockId, expanded.dataItemByBlockId)
      const scopedParent = resolveBlockDataItem(expanded.block, parentItem)
      return {
        ...expanded.block,
        children: (expanded.block.children ?? []).map((child) => {
          const childParent = dataItemByBlockId[child.id] ?? scopedParent
          const [next] = expandList([child], childParent)
          return next ?? child
        }),
      }
    })
  }

  return {
    document: {
      ...document,
      blocks: expandList(document.blocks, null),
    },
    dataItemByBlockId,
  }
}
