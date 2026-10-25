import type { ListAddonProps, WebsiteAddon, WebsiteBlock } from '../types'
import { blockTreeLabel, listSlideTemplateTreeChildren } from './contentTreeModel'
import { createEmptyListItem, inferListItemGroup, listMainBlock } from './list'
import { isTemplateHost, readHostTemplate } from './templateHost'

export type ListTemplateElement =
  | { kind: 'block'; templateBlockId: string; label: string }
  | {
      kind: 'addon'
      templateBlockId: string
      templateAddonId: string
      label: string
      addonType: WebsiteAddon['type']
    }

export function templateHasListItemContent(template: WebsiteBlock | null): boolean {
  if (!template) return false
  const { blocks, legacyShellAddons } = listSlideTemplateTreeChildren(template)
  return blocks.length + legacyShellAddons.length > 0
}

/** Ensure at least one manual row exists when the item template already has content. */
export function ensureListManualItemsForTemplateProps(props: ListAddonProps): ListAddonProps {
  let next = props
  if (props.dataSource === 'manual' && props.manualItems.length === 0 && templateHasListItemContent(props.itemTemplate)) {
    next = { ...next, manualItems: [createEmptyListItem()] }
  }
  return next
}

function addonLabel(addon: WebsiteAddon): string {
  const named = addon.name?.trim()
  if (named) return named
  return addon.type
}

function pushAddonsOnBlock(block: WebsiteBlock, into: ListTemplateElement[], blockLabel: string) {
  const addons = [...(block.addons ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  for (const addon of addons) {
    into.push({
      kind: 'addon',
      templateBlockId: block.id,
      templateAddonId: addon.id,
      label: addonLabel(addon),
      addonType: addon.type,
    })
    if (isTemplateHost(addon)) {
      const nested = readHostTemplate(addon)
      if (nested) collectFromShell(nested, into, blockLabel)
    }
  }
}

function walkContentBlock(block: WebsiteBlock, into: ListTemplateElement[], blockLabel: string) {
  into.push({
    kind: 'block',
    templateBlockId: block.id,
    label: blockTreeLabel(block, blockLabel),
  })
  pushAddonsOnBlock(block, into, blockLabel)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  for (const child of children) walkContentBlock(child, into, blockLabel)
}

function collectFromShell(shell: WebsiteBlock, into: ListTemplateElement[], blockLabel: string) {
  const { blocks, legacyShellAddons } = listSlideTemplateTreeChildren(shell)
  for (const addon of legacyShellAddons) {
    into.push({
      kind: 'addon',
      templateBlockId: shell.id,
      templateAddonId: addon.id,
      label: addonLabel(addon),
      addonType: addon.type,
    })
    if (isTemplateHost(addon)) {
      const nested = readHostTemplate(addon)
      if (nested) collectFromShell(nested, into, blockLabel)
    }
  }
  for (const block of blocks) walkContentBlock(block, into, blockLabel)
}

/** Add-ons (and nested blocks) inside the list row main block — not the shell wrapper. */
export function collectListRowTemplateElements(
  template: WebsiteBlock | null,
  itemGroup: string | null | undefined,
  blockLabel: string,
): ListTemplateElement[] {
  const main = listMainBlock(template, itemGroup)
  if (!main) return []
  const elements: ListTemplateElement[] = []
  pushAddonsOnBlock(main, elements, blockLabel)
  const children = [...(main.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  for (const child of children) walkContentBlock(child, elements, blockLabel)
  return elements
}

/** @deprecated Prefer collectListRowTemplateElements for list row editing. */
export function collectListTemplateElements(
  template: WebsiteBlock | null,
  blockLabel: string,
): ListTemplateElement[] {
  if (!template) return []
  const elements: ListTemplateElement[] = []
  collectFromShell(template, elements, blockLabel)
  return elements
}

export function syncListAddonManualItems(addon: WebsiteAddon): WebsiteAddon {
  if (addon.type !== 'list') return addon
  let props = inferListItemGroup(addon.props)
  props = ensureListManualItemsForTemplateProps(props)
  if (props === addon.props) return addon
  return { ...addon, props }
}
