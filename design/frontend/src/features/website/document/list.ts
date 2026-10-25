import { nanoid } from 'nanoid'
import {
  MAX_LIST_DATA_ITEMS,
  type ListAddonProps,
  type ListManualItem,
  type WebsiteAddon,
  type WebsiteBlock,
} from '../types'
import {
  getDataItemByPath,
  itemsFromDataValue,
  resolveBlockListItems,
  expandBoundBlocks,
} from './dataBinding'
import { applyDataItemToBlock, resolveSliderSlideBlock } from './slider'
import { listSlideTemplateTreeChildren } from './contentTreeModel'
import { isTemplateHost, nestedItemsKey, readHostTemplate } from './templateHost'

export const DEFAULT_LIST_ITEM_GAP = 12

/** Primary content block under the list item shell (one row layout). */
export function listMainBlock(
  template: WebsiteBlock | null,
  itemGroup: string | null | undefined,
): WebsiteBlock | null {
  if (!template) return null
  const group = itemGroup?.trim()
  if (group) {
    const match = (template.children ?? []).find((child) => child.groupName?.trim() === group)
    if (match) return match
  }
  const { blocks } = listSlideTemplateTreeChildren(template)
  if (blocks.length === 1) return blocks[0]!
  if (blocks.length > 0 && !group) return blocks[0]!
  return null
}

/**
 * Block tree rendered for one list row (same rules as slider slides).
 * Edit row 0 uses the full shell so template children stay visible and selectable.
 */
export function resolveListRowTemplate(
  template: WebsiteBlock,
  itemGroup: string | null | undefined,
  options?: { authoring?: boolean; authoringEmpty?: boolean },
): WebsiteBlock {
  const authoring = options?.authoring ?? options?.authoringEmpty ?? false
  if (authoring) return template
  const main = listMainBlock(template, itemGroup)
  if (main) return main
  return resolveSliderSlideBlock(template, itemGroup, { authoring: false })
}

export function inferListItemGroup(props: ListAddonProps): ListAddonProps {
  if (props.itemGroup?.trim()) return props
  const template = props.itemTemplate
  if (!template) return props
  const { blocks } = listSlideTemplateTreeChildren(template)
  const first = blocks[0]
  const group = first?.groupName?.trim()
  if (blocks.length >= 1 && group) {
    return { ...props, itemGroup: group }
  }
  return props
}
export const MIN_LIST_ITEM_GAP = 0
export const MAX_LIST_ITEM_GAP = 64

export function clampListItemGap(value: number | null | undefined): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : DEFAULT_LIST_ITEM_GAP
  return Math.min(MAX_LIST_ITEM_GAP, Math.max(MIN_LIST_ITEM_GAP, n))
}

export type ListDataField = {
  kind: 'field'
  path: string
  fieldKind: 'text' | 'media' | 'images'
  label: string
}

export type ListDataSet = {
  kind: 'set'
  id: string
  path: string
  label: string
  nodes: ListDataNode[]
}

export type ListDataNode = ListDataField | ListDataSet

function fieldNodes(addon: WebsiteAddon): ListDataField[] {
  const fields = addon.dataBinding?.fields
  if (!fields) return []
  const nodes: ListDataField[] = []
  for (const [propKey, path] of Object.entries(fields)) {
    if (!path?.trim()) continue
    const fieldKind = propKey === 'media' ? 'media' : propKey === 'images' ? 'images' : 'text'
    nodes.push({ kind: 'field', path, fieldKind, label: path })
  }
  return nodes
}

function repeatingCard(block: WebsiteBlock): WebsiteBlock | null {
  const group = block.dataBinding?.itemGroup?.trim()
  if (!group) return null
  return (block.children ?? []).find((child) => child.groupName?.trim() === group) ?? null
}

function pushAddon(addon: WebsiteAddon, into: ListDataNode[]) {
  if (isTemplateHost(addon)) {
    const template = readHostTemplate(addon)
    const explicit = addon.props.itemsPath?.trim()
    into.push({
      kind: 'set',
      id: addon.id,
      path: explicit || nestedItemsKey(addon.id),
      label: addon.name?.trim() || addon.type,
      nodes: collectListDataTree(template),
    })
    return
  }
  into.push(...fieldNodes(addon))
}

function walkBlock(block: WebsiteBlock, into: ListDataNode[], insideSet: boolean) {
  const card = !insideSet ? repeatingCard(block) : null
  if (card) {
    const path = block.dataBinding?.itemsPath?.trim() || nestedItemsKey(block.id)
    const nodes: ListDataNode[] = []
    walkBlock(card, nodes, true)
    into.push({
      kind: 'set',
      id: block.id,
      path,
      label: block.name?.trim() || block.dataBinding?.itemGroup?.trim() || 'Items',
      nodes,
    })
    for (const addon of block.addons ?? []) pushAddon(addon, into)
    for (const child of block.children ?? []) {
      if (child.id === card.id) continue
      walkBlock(child, into, false)
    }
    return
  }
  for (const addon of block.addons ?? []) pushAddon(addon, into)
  for (const child of block.children ?? []) walkBlock(child, into, insideSet)
}

/** Tree of text, image, and nested repeating sets inside a list item template. */
export function collectListDataTree(template: WebsiteBlock | null): ListDataNode[] {
  if (!template) return []
  const nodes: ListDataNode[] = []
  walkBlock(template, nodes, false)
  return nodes
}

export function cloneListManualItemData(data: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(data)
}

export function createEmptyListItem(): ListManualItem {
  return { id: nanoid(10), data: {} }
}

/** Fresh row data with empty values for every bindable field (no shared references). */
export function createEmptyListItemForTree(nodes: ListDataNode[]): ListManualItem {
  let data: Record<string, unknown> = {}
  function walk(fieldNodes: ListDataNode[]) {
    for (const node of fieldNodes) {
      if (node.kind === 'field') {
        const empty =
          node.fieldKind === 'images' ? [] : node.fieldKind === 'media' ? null : ''
        data = writeRecordValue(data, node.path, empty)
      } else {
        data = writeRecordValue(data, node.path, [])
      }
    }
  }
  walk(nodes)
  return { id: nanoid(10), data }
}

export function createEmptyNestedRow(): Record<string, unknown> {
  return { _id: nanoid(10) }
}

export function readRecordValue(data: Record<string, unknown>, path: string): unknown {
  if (Object.prototype.hasOwnProperty.call(data, path)) return data[path]
  return getDataItemByPath(data, path)
}

export function writeRecordValue(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  if (!path.includes('.')) return { ...data, [path]: value }
  const parts = path.split('.')
  const root: Record<string, unknown> = { ...data }
  let cursor = root
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]!
    const existing = cursor[key]
    const next =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {}
    cursor[key] = next
    cursor = next
  }
  cursor[parts[parts.length - 1]!] = value
  return root
}

export function readNestedRows(data: Record<string, unknown>, path: string): Record<string, unknown>[] {
  return itemsFromDataValue(readRecordValue(data, path)).map((row) =>
    row._id ? row : { ...row, _id: nanoid(10) },
  )
}

export function resolveListItems(input: {
  addonId: string
  dataSource: 'dataset' | 'manual' | 'parent'
  datasetId: string | null
  itemsPath?: string | null
  manualItems: ListManualItem[]
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  parentDataItem?: Record<string, unknown> | null
  maxItems?: number
}): Record<string, unknown>[] {
  const max = input.maxItems ?? MAX_LIST_DATA_ITEMS
  if (input.dataSource === 'parent' && input.parentDataItem) {
    const path = input.itemsPath?.trim() || nestedItemsKey(input.addonId)
    return itemsFromDataValue(readRecordValue(input.parentDataItem, path)).slice(0, max)
  }
  if (input.dataSource === 'manual') {
    return input.manualItems
      .slice(0, max)
      .map((item) => cloneListManualItemData(item.data))
  }
  if (input.dataSource === 'parent') {
    const path = input.itemsPath?.trim()
    if (!path || !input.parentDataItem) return []
    return itemsFromDataValue(getDataItemByPath(input.parentDataItem, path)).slice(0, max)
  }
  if (!input.datasetId) return []
  return (input.datasetItemsById?.[input.datasetId] ?? []).slice(0, max)
}

/**
 * Apply a row to the item template. When `expandSets` is set, content blocks that
 * own an item group are repeated from that row (and from datasets).
 */
export function presentListItemBlock(
  template: WebsiteBlock,
  dataItem: Record<string, unknown> | null,
  datasetItemsById: Record<string, Record<string, unknown>[]>,
  expandSets: boolean,
): { block: WebsiteBlock; dataItemByBlockId: Record<string, Record<string, unknown>> } {
  const applied = applyDataItemToBlock(template, dataItem)
  if (!expandSets || !dataItem) return { block: applied, dataItemByBlockId: {} }
  const dataItemByBlockId: Record<string, Record<string, unknown>> = {}
  return {
    block: expandSetsInBlock(applied, dataItem, datasetItemsById, dataItemByBlockId),
    dataItemByBlockId,
  }
}

function expandSetsInBlock(
  block: WebsiteBlock,
  parentItem: Record<string, unknown> | null,
  datasetItemsById: Record<string, Record<string, unknown>[]>,
  into: Record<string, Record<string, unknown>>,
): WebsiteBlock {
  const items = resolveBlockListItems(block, parentItem, datasetItemsById)
  const expanded = expandBoundBlocks(block, items)
  Object.assign(into, expanded.dataItemByBlockId)
  return {
    ...expanded.block,
    children: (expanded.block.children ?? []).map((child) => {
      const row = expanded.dataItemByBlockId[child.id] ?? parentItem
      const applied = row ? applyDataItemToBlock(child, row) : child
      return expandSetsInBlock(applied, row, datasetItemsById, into)
    }),
  }
}
