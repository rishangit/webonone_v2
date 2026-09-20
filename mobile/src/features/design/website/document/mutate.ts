import { nanoid } from '@/features/design/website/nanoid'
import { getAddonModuleByType, getAddonModulesForKind } from '../addons/registry'
import {
  emptyLayoutByBreakpoint,
  type WebsiteAddon,
  type WebsiteBlock,
  type WebsiteDesignerKind,
  type WebsiteDocumentV1,
} from '../types'
import {
  cloneBlockTree,
  insertBlocksFromPreset,
  slugifyGroupName,
  stripNestedSliders,
  updateBlockById,
} from './blockTree'
import {
  ensureSliderSlideTemplate,
  findBlockInTree,
  findSliderHostContext,
  growSlideShellToFitContent,
  updateTemplateBlock,
} from './slider'

export {
  collectGoogleFontUrls,
  resolveButtonStyle,
  resolveTextStyle,
  snapshotDocument,
} from './theme'

export {
  addBlock,
  blockDepth,
  changeLayer,
  cloneBlockTree,
  deleteAddon,
  deleteBlock,
  documentFromBlock,
  duplicateAddon,
  duplicateBlock,
  findBlock,
  findBlockPath,
  insertBlocksFromPreset,
  mapBlocks,
  reorderAddons,
  reorderBlocks,
  updateAddon,
  updateBlockById,
} from './blockTree'

export function addAddon(document: WebsiteDocumentV1, blockId: string, type: WebsiteAddon['type']): WebsiteDocumentV1 {
  const module = getAddonModuleByType(type)
  return updateBlockById(document, blockId, (block) => {
    const addon = module?.createDefaultAddon(block.addons.length)
    if (!addon) return block
    return { ...block, addons: [...block.addons, addon] }
  })
}

export function addBlocksFromPreset(
  document: WebsiteDocumentV1,
  parentBlockId: string | null,
  presetDocument: WebsiteDocumentV1,
  designerKind?: WebsiteDesignerKind,
  presetName?: string | null,
): WebsiteDocumentV1 {
  return insertBlocksFromPreset(
    document,
    parentBlockId,
    presetDocument,
    getAddonModulesForKind(designerKind),
    presetName,
  )
}

/** @deprecated Use addBlocksFromPreset */
export function addAddonsFromPreset(
  document: WebsiteDocumentV1,
  blockId: string,
  presetDocument: WebsiteDocumentV1,
  designerKind?: WebsiteDesignerKind,
  presetName?: string | null,
): WebsiteDocumentV1 {
  return addBlocksFromPreset(document, blockId, presetDocument, designerKind, presetName)
}

function resolveSliderTemplateTarget(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId?: string | null,
): { document: WebsiteDocumentV1; templateBlockId: string; shellId: string } | null {
  const nextDoc = ensureSliderSlideTemplate(document, hostBlockId, sliderAddonId)
  const ctx = findSliderHostContext(nextDoc, hostBlockId, sliderAddonId)
  if (!ctx) return null
  const shellId = ctx.slideTemplate.id
  const targetId =
    templateBlockId &&
    templateBlockId !== shellId &&
    findBlockInTree(ctx.slideTemplate, templateBlockId)
      ? templateBlockId
      : shellId
  return { document: nextDoc, templateBlockId: targetId, shellId }
}

/**
 * Add an addon into a visible content element under the slide shell.
 * Never puts user addons on the hidden shell — creates a child block first when needed.
 */
export function addAddonToSliderTemplate(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  type: WebsiteAddon['type'],
  templateBlockId?: string | null,
): WebsiteDocumentV1 {
  const target = resolveSliderTemplateTarget(document, hostBlockId, sliderAddonId, templateBlockId)
  if (!target) return document
  const module = getAddonModuleByType(type)
  if (!module) return document

  let doc = target.document
  let blockId = target.templateBlockId
  if (blockId === target.shellId) {
    doc = addBlockToSliderTemplate(doc, hostBlockId, sliderAddonId, target.shellId)
    const ctx = findSliderHostContext(doc, hostBlockId, sliderAddonId)
    const created = ctx?.slideTemplate.children?.at(-1)
    if (!created) return document
    blockId = created.id
  }

  doc = updateTemplateBlock(doc, hostBlockId, sliderAddonId, blockId, (block) => {
    const addon = module.createDefaultAddon(block.addons.length)
    return { ...block, addons: [...block.addons, addon] }
  })
  return growSlideShellToFitContent(doc, hostBlockId, sliderAddonId)
}

/** Insert a preset into the slider as a movable child of the slide shell canvas. */
export function addBlocksFromPresetToSliderTemplate(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  presetDocument: WebsiteDocumentV1,
  templateBlockId?: string | null,
  presetName?: string | null,
): WebsiteDocumentV1 {
  // Presets always attach under the shell (or under a selected non-shell content element).
  const target = resolveSliderTemplateTarget(document, hostBlockId, sliderAddonId, templateBlockId)
  if (!target) return document
  const groupStamp = presetName ? slugifyGroupName(presetName) : ''
  const incoming = [...presetDocument.blocks]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((block, index) => {
      const cloned = stripNestedSliders(cloneBlockTree(block, index, null))
      if (!groupStamp || cloned.groupName?.trim()) return cloned
      return { ...cloned, groupName: groupStamp }
    })
  if (incoming.length === 0) return document
  // When targeting the shell, append presets as shell children (visible content elements).
  const parentId = target.templateBlockId
  let doc = updateTemplateBlock(
    target.document,
    hostBlockId,
    sliderAddonId,
    parentId,
    (block) => {
      const existingChildren = [...(block.children ?? [])]
      const cloned = incoming.map((child, index) => ({
        ...child,
        zIndex: existingChildren.length + index,
      }))
      return { ...block, children: [...existingChildren, ...cloned] }
    },
  )
  return growSlideShellToFitContent(doc, hostBlockId, sliderAddonId)
}

/** Add an empty nested content block under the slider template (or a template child). */
export function addBlockToSliderTemplate(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  templateBlockId?: string | null,
): WebsiteDocumentV1 {
  const target = resolveSliderTemplateTarget(document, hostBlockId, sliderAddonId, templateBlockId)
  if (!target) return document
  let doc = updateTemplateBlock(
    target.document,
    hostBlockId,
    sliderAddonId,
    target.templateBlockId,
    (block) => {
      const children = [...(block.children ?? [])]
      const child: WebsiteBlock = {
        id: nanoid(10),
        zIndex: children.length,
        layout: emptyLayoutByBreakpoint({
          col: 1,
          colSpan: 12,
          top: 16 + children.length * 24,
          height: 160,
        }),
        addons: [],
        children: [],
      }
      return { ...block, children: [...children, child] }
    },
  )
  return growSlideShellToFitContent(doc, hostBlockId, sliderAddonId)
}
