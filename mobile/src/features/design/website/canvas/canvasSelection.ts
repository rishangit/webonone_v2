import type { DesignerSelection } from '@/features/design/website/types'

export function designerSelectionKey(selection: DesignerSelection): string {
  switch (selection.kind) {
    case 'container':
      return 'container'
    case 'block':
      return `block:${selection.blockId}`
    case 'addon':
      return `addon:${selection.blockId}:${selection.addonId}`
    case 'templateBlock':
      return `tb:${selection.hostBlockId}:${selection.sliderAddonId}:${selection.templateBlockId}`
    case 'templateAddon':
      return `ta:${selection.hostBlockId}:${selection.sliderAddonId}:${selection.templateBlockId}:${selection.templateAddonId}`
  }
}

export function blockSelectionGrabbed(
  blockId: string,
  templateHost?: { hostBlockId: string; sliderAddonId: string },
  slideShell?: boolean,
): DesignerSelection {
  if (slideShell && templateHost) {
    return { kind: 'addon', blockId: templateHost.hostBlockId, addonId: templateHost.sliderAddonId }
  }
  if (templateHost) {
    return {
      kind: 'templateBlock',
      hostBlockId: templateHost.hostBlockId,
      sliderAddonId: templateHost.sliderAddonId,
      templateBlockId: blockId,
    }
  }
  return { kind: 'block', blockId }
}

export function addonSelectionGrabbed(
  blockId: string,
  addonId: string,
  templateHost?: { hostBlockId: string; sliderAddonId: string },
): DesignerSelection {
  if (templateHost) {
    return {
      kind: 'templateAddon',
      hostBlockId: templateHost.hostBlockId,
      sliderAddonId: templateHost.sliderAddonId,
      templateBlockId: blockId,
      templateAddonId: addonId,
    }
  }
  return { kind: 'addon', blockId, addonId }
}

/** Same capture rules as web DocumentRenderer / NestedBlockTree pointerdown. */
export function canCaptureMove(options: {
  interactive: boolean
  slideShell?: boolean
  /** Page block or template block that owns this node is selected. */
  ancestorSelected: boolean
  /** Selected slider host — nested slide content defers so the slider keeps the drag. */
  sliderHostSelected?: boolean
}): boolean {
  if (!options.interactive) return false
  if (options.ancestorSelected) return false
  if (options.sliderHostSelected && !options.slideShell) return false
  return true
}
