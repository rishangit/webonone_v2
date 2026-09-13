import type { DesignerSelection, WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../types'
import { findBlock } from './blockTree'
import { findBlockInTree } from './slider'

export type SlideTemplateTreeChildren = {
  /** Addons stored directly on the slide shell (legacy); shell row itself is hidden. */
  legacyShellAddons: WebsiteAddon[]
  /** Visible content blocks under the slide shell. */
  blocks: WebsiteBlock[]
}

/** List tree-visible nodes under a slider slide template (shell row hidden). */
export function listSlideTemplateTreeChildren(slideTemplate: WebsiteBlock | null): SlideTemplateTreeChildren {
  if (!slideTemplate) {
    return { legacyShellAddons: [], blocks: [] }
  }
  const legacyShellAddons = [...(slideTemplate.addons ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const blocks = [...(slideTemplate.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  return { legacyShellAddons, blocks }
}

/** Path from slide-template root to target block (inclusive). Empty when not found. */
export function findBlockPathInTree(root: WebsiteBlock, blockId: string): WebsiteBlock[] {
  const path: WebsiteBlock[] = []
  if (walkBlockPath(root, blockId, path)) return path
  return []
}

function walkBlockPath(block: WebsiteBlock, blockId: string, path: WebsiteBlock[]): boolean {
  path.push(block)
  if (block.id === blockId) return true
  for (const child of block.children ?? []) {
    if (walkBlockPath(child, blockId, path)) return true
  }
  for (const addon of block.addons ?? []) {
    if (addon.type === 'slider' && addon.props.slideTemplate) {
      if (walkBlockPath(addon.props.slideTemplate, blockId, path)) return true
    }
  }
  path.pop()
  return false
}

export function templateCollapseKey(blockId: string): string {
  return `template:${blockId}`
}

export function addonCollapseKey(addonId: string): string {
  return `addon:${addonId}`
}

export function templateSliderCollapseKey(addonId: string): string {
  return `template-slider:${addonId}`
}

/** Collapse keys to open so a deep template selection is visible in the tree. */
export function templateCollapseKeysForPath(path: WebsiteBlock[]): string[] {
  return path.map((block) => templateCollapseKey(block.id))
}

export function blockTreeLabel(block: WebsiteBlock, blockLabel: string): string {
  const group = block.groupName?.trim()
  return group ? `${blockLabel} · ${group}` : blockLabel
}

/** Resolve slide template for a content slider on the page. */
export function findSliderSlideTemplate(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
): WebsiteBlock | null {
  const host = findBlock(document, hostBlockId)
  const slider = host?.addons.find((addon) => addon.id === sliderAddonId)
  if (!slider || slider.type !== 'slider') return null
  return slider.props.slideTemplate
}

function collectSliderCollapseKeysOnPath(path: WebsiteBlock[], keys: Set<string>) {
  for (const block of path) {
    for (const addon of block.addons ?? []) {
      if (addon.type === 'slider') {
        keys.add(templateSliderCollapseKey(addon.id))
        if (addon.props.slideTemplate) {
          keys.add(templateCollapseKey(addon.props.slideTemplate.id))
        }
      }
    }
  }
}

/** Collapse keys to expand when a templateBlock/templateAddon is selected. */
export function collapseKeysForTemplateSelection(
  document: WebsiteDocumentV1,
  selection: Extract<DesignerSelection, { kind: 'templateBlock' } | { kind: 'templateAddon' }>,
): string[] {
  const keys = new Set<string>([addonCollapseKey(selection.sliderAddonId)])

  const slideTemplate = findSliderSlideTemplate(document, selection.hostBlockId, selection.sliderAddonId)
  if (!slideTemplate) return [...keys]

  keys.add(templateCollapseKey(slideTemplate.id))

  const path = findBlockPathInTree(slideTemplate, selection.templateBlockId)
  for (const key of templateCollapseKeysForPath(path)) {
    keys.add(key)
  }
  collectSliderCollapseKeysOnPath(path, keys)

  if (selection.kind === 'templateAddon') {
    for (const block of path) {
      for (const addon of block.addons ?? []) {
        if (addon.id === selection.templateAddonId && addon.type === 'slider') {
          keys.add(templateSliderCollapseKey(addon.id))
          if (addon.props.slideTemplate) {
            keys.add(templateCollapseKey(addon.props.slideTemplate.id))
          }
        }
      }
    }
  }

  return [...keys]
}

export { findBlockInTree }
