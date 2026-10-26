import type { MediaRef, WebsiteAddon, WebsiteDocumentV1 } from '../types'
import { findBlock, updateAddon } from './blockTree'
import { resolveAddonProps } from './dataBinding'
import { cloneListManualItemData, writeRecordValue } from './list'
import { updateTemplateAddon } from './slider'

function mediaFromAddon(addon: Extract<WebsiteAddon, { type: 'image' }>): MediaRef | null {
  const bp = addon.props.mediaByBreakpoint
  return bp?.['2xl'] ?? bp?.xl ?? bp?.lg ?? bp?.md ?? bp?.sm ?? null
}

/** Overlay one manual row onto a template add-on for settings UI. */
export function mergeListRowIntoTemplateAddon(
  addon: WebsiteAddon,
  rowData: Record<string, unknown>,
): WebsiteAddon {
  return resolveAddonProps(addon, rowData)
}

/** Read bound content from a template add-on back into manual row data. */
export function extractListRowPatchFromTemplateAddon(
  addon: WebsiteAddon,
  rowData: Record<string, unknown>,
): Record<string, unknown> {
  const fields = addon.dataBinding?.fields
  if (!fields) return rowData
  let data = rowData

  if (addon.type === 'text') {
    const path = fields.content?.trim()
    if (path) data = writeRecordValue(data, path, addon.props.content ?? '')
  } else if (addon.type === 'button') {
    const path = fields.label?.trim()
    if (path) data = writeRecordValue(data, path, addon.props.label ?? '')
  } else if (addon.type === 'image') {
    const path = fields.media?.trim()
    if (path) data = writeRecordValue(data, path, mediaFromAddon(addon))
  }

  return data
}

/** Keep layout/styles on the template; clear bound content so rows come from manual data only. */
export function stripTemplateAddonRowContent(addon: WebsiteAddon): WebsiteAddon {
  const fields = addon.dataBinding?.fields
  if (!fields || Object.keys(fields).length === 0) return addon

  if (addon.type === 'text' && fields.content?.trim()) {
    return { ...addon, props: { ...addon.props, content: '' } }
  }
  if (addon.type === 'button' && fields.label?.trim()) {
    return { ...addon, props: { ...addon.props, label: '' } }
  }
  if (addon.type === 'image' && fields.media?.trim()) {
    return { ...addon, props: { ...addon.props, mediaByBreakpoint: {} } }
  }
  return addon
}

export function saveManualListTemplateAddon(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  listAddonId: string,
  templateBlockId: string,
  editedAddon: WebsiteAddon,
  manualItemId: string,
): WebsiteDocumentV1 {
  const hostBlock = findBlock(document, hostBlockId)
  const listAddon = hostBlock?.addons.find((addon) => addon.id === listAddonId)
  if (
    !listAddon ||
    listAddon.type !== 'list' ||
    listAddon.props.dataSource !== 'manual' ||
    !listAddon.props.manualItems.some((item) => item.id === manualItemId)
  ) {
    return updateTemplateAddon(document, hostBlockId, listAddonId, templateBlockId, editedAddon)
  }

  const manualItem = listAddon.props.manualItems.find((item) => item.id === manualItemId)!
  const nextRowData = cloneListManualItemData(
    extractListRowPatchFromTemplateAddon(editedAddon, manualItem.data),
  )
  const templateAddon = stripTemplateAddonRowContent(editedAddon)

  const nextDoc = updateTemplateAddon(
    document,
    hostBlockId,
    listAddonId,
    templateBlockId,
    templateAddon,
  )

  const hostAfter = findBlock(nextDoc, hostBlockId)
  const listAfter = hostAfter?.addons.find((addon) => addon.id === listAddonId)
  if (!listAfter || listAfter.type !== 'list') return nextDoc

  return updateAddon(nextDoc, hostBlockId, {
    ...listAfter,
    props: {
      ...listAfter.props,
      manualItems: listAfter.props.manualItems.map((item) =>
        item.id === manualItemId ? { ...item, data: nextRowData } : item,
      ),
    },
  })
}
