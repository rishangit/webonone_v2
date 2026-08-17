import { nanoid } from 'nanoid'
import { getAddonModuleByType } from '../addons/registry'
import { emptyLayoutByBreakpoint } from '../types'
import type { WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../types'

export {
  collectGoogleFontUrls,
  resolveButtonStyle,
  resolveTextStyle,
  snapshotDocument,
} from './theme'

export function addBlock(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  const block: WebsiteBlock = {
    id: nanoid(10),
    zIndex: document.blocks.length,
    layout: emptyLayoutByBreakpoint({ top: 16 + document.blocks.length * 24, height: 180 }),
    addons: [],
  }
  return { ...document, blocks: [...document.blocks, block] }
}

export function addAddon(document: WebsiteDocumentV1, blockId: string, type: WebsiteAddon['type']): WebsiteDocumentV1 {
  const module = getAddonModuleByType(type)
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      if (block.id !== blockId) return block
      const addon = module?.createDefaultAddon(block.addons.length)
      if (!addon) return block
      return { ...block, addons: [...block.addons, addon] }
    }),
  }
}

export function deleteBlock(document: WebsiteDocumentV1, blockId: string): WebsiteDocumentV1 {
  return { ...document, blocks: document.blocks.filter((block) => block.id !== blockId) }
}

export function deleteAddon(document: WebsiteDocumentV1, blockId: string, addonId: string): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === blockId ? { ...block, addons: block.addons.filter((addon) => addon.id !== addonId) } : block,
    ),
  }
}

export function updateAddon(
  document: WebsiteDocumentV1,
  blockId: string,
  addon: WebsiteAddon,
): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === blockId
        ? { ...block, addons: block.addons.map((item) => (item.id === addon.id ? addon : item)) }
        : block,
    ),
  }
}

export function reorderAddons(
  document: WebsiteDocumentV1,
  blockId: string,
  fromIndex: number,
  toIndex: number,
): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      if (block.id !== blockId) return block
      const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
      const [moved] = addons.splice(fromIndex, 1)
      if (!moved) return block
      addons.splice(toIndex, 0, moved)
      return { ...block, addons: addons.map((item, index) => ({ ...item, zIndex: index })) }
    }),
  }
}

export function reorderBlocks(
  document: WebsiteDocumentV1,
  fromIndex: number,
  toIndex: number,
): WebsiteDocumentV1 {
  const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)
  const [moved] = blocks.splice(fromIndex, 1)
  if (!moved) return document
  blocks.splice(toIndex, 0, moved)
  return { ...document, blocks: blocks.map((block, index) => ({ ...block, zIndex: index })) }
}

export function changeLayer(
  document: WebsiteDocumentV1,
  target: { blockId: string; addonId?: string },
  direction: 'up' | 'down',
): WebsiteDocumentV1 {
  if (target.addonId) {
    return {
      ...document,
      blocks: document.blocks.map((block) => {
        if (block.id !== target.blockId) return block
        return { ...block, addons: shiftLayer(block.addons, target.addonId!, direction) }
      }),
    }
  }
  return { ...document, blocks: shiftLayer(document.blocks, target.blockId, direction) }
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
