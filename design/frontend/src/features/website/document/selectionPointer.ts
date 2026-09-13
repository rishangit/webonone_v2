import type { DesignerSelection } from '../types'

/** Resize / toolbar controls — never start a move/select from these. */
export function isChromePointerTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('[data-resize-handle], [data-chrome-action], [data-addon-control]'))
  )
}

/**
 * When an ancestor is already selected, child pointerdowns should bubble so
 * drag/resize keeps that selection instead of stealing it.
 */
export function shouldDeferToSelectedAncestor(
  selection: DesignerSelection | null | undefined,
  currentTarget: EventTarget | null,
  ctx: {
    /** Page block that hosts this node (slider host or the block itself). */
    hostBlockId?: string
    /** Slider addon id when inside a slide template. */
    sliderAddonId?: string
    /** This template block id (when handling a template block or its addon). */
    templateBlockId?: string
    /** This page-level block id (when handling a page block). */
    blockId?: string
  },
): boolean {
  if (!selection || !(currentTarget instanceof Element)) return false

  // Selected page host — keep dragging the host while interacting with nested slider content.
  if (selection.kind === 'block' && ctx.hostBlockId && selection.blockId === ctx.hostBlockId) {
    if (!ctx.blockId || ctx.blockId !== selection.blockId) return true
  }

  // Selected ancestor page block — keep dragging it instead of a nested child block.
  if (selection.kind === 'block' && ctx.blockId && selection.blockId !== ctx.blockId) {
    return Boolean(currentTarget.closest(`[data-block-id="${selection.blockId}"]`))
  }

  // Selected slider — keep dragging the slider instead of a nested preset/addon.
  if (selection.kind === 'addon' && ctx.sliderAddonId && selection.addonId === ctx.sliderAddonId) {
    return true
  }

  // Selected ancestor template block — keep dragging it instead of a nested child.
  if (
    selection.kind === 'templateBlock' &&
    ctx.sliderAddonId &&
    selection.sliderAddonId === ctx.sliderAddonId &&
    ctx.templateBlockId &&
    selection.templateBlockId !== ctx.templateBlockId
  ) {
    return Boolean(currentTarget.closest(`[data-template-block-id="${selection.templateBlockId}"]`))
  }

  return false
}
