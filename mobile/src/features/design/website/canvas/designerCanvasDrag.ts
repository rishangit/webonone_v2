import { findBlock, findBlockPath, updateBlockById } from '@/features/design/website/document/blockTree'
import {
  ADDON_LAYOUT_LIMITS,
  CONTENT_BLOCK_LAYOUT_LIMITS,
  pinchToRect,
  pointerToRect,
  resolveLayoutRect,
  ROW_HEIGHT,
  writeLayoutRect,
  type LayoutLimits,
  type PinchSpans,
  type ResizeHandle,
} from '@/features/design/website/document/layout'
import {
  findBlockInTree,
  findSliderHostContext,
  updateTemplateAddon,
  updateTemplateBlock,
} from '@/features/design/website/document/slider'
import type { DesignerSelection, LayoutRect, WebsiteBreakpoint, WebsiteDocumentV1 } from '@/features/design/website/types'

export type CanvasGestureHandle = ResizeHandle | 'move' | 'pinch'

export type CanvasDragSession = {
  handle: CanvasGestureHandle
  startRect: LayoutRect
  parentWidth: number
  scale: number
  selection: DesignerSelection
  blockId: string
  addonId?: string
  hostBlockId?: string
  sliderAddonId?: string
  templateBlockId?: string
  templateAddonId?: string
  layoutLimits: LayoutLimits
  startDocument: WebsiteDocumentV1
  isRootBlock: boolean
  pinchStart?: PinchSpans
}

export function layoutParentWidth(
  document: WebsiteDocumentV1,
  blockId: string,
  canvasWidth: number,
  breakpoint: WebsiteBreakpoint,
  includeTargetBlock: boolean,
): number {
  const path = findBlockPath(document, blockId)
  if (path.length === 0) return canvasWidth
  const ancestors = includeTargetBlock ? path : path.slice(0, -1)
  let width = canvasWidth
  for (const ancestor of ancestors) {
    width = width * (resolveLayoutRect(ancestor.layout, breakpoint).colSpan / 12)
  }
  return width
}

export function createCanvasDragSession(
  document: WebsiteDocumentV1,
  breakpoint: WebsiteBreakpoint,
  canvasWidth: number,
  scale: number,
  handle: CanvasGestureHandle,
  grabbed: DesignerSelection,
): CanvasDragSession | null {
  if (grabbed.kind === 'container') return null

  if (grabbed.kind === 'templateBlock' || grabbed.kind === 'templateAddon') {
    const ctx = findSliderHostContext(document, grabbed.hostBlockId, grabbed.sliderAddonId)
    if (!ctx) return null
    const templateBlock = findBlockInTree(ctx.slideTemplate, grabbed.templateBlockId)
    if (!templateBlock) return null
    if (grabbed.kind === 'templateBlock' && templateBlock.id === ctx.slideTemplate.id) return null
    const templateAddon =
      grabbed.kind === 'templateAddon'
        ? templateBlock.addons.find((item) => item.id === grabbed.templateAddonId)
        : null
    if (grabbed.kind === 'templateAddon' && !templateAddon) return null
    const startLayout = templateAddon ? templateAddon.layout : templateBlock.layout
    const hostWidth = layoutParentWidth(document, grabbed.hostBlockId, canvasWidth, breakpoint, true)
    const sliderRect = resolveLayoutRect(ctx.slider.layout, breakpoint)
    const sliderWidth = hostWidth * (sliderRect.colSpan / 12)
    const parentWidth =
      grabbed.kind === 'templateAddon'
        ? sliderWidth * (resolveLayoutRect(templateBlock.layout, breakpoint).colSpan / 12)
        : sliderWidth
    return {
      handle,
      startRect: resolveLayoutRect(startLayout, breakpoint),
      parentWidth,
      scale,
      selection: grabbed,
      blockId: grabbed.hostBlockId,
      hostBlockId: grabbed.hostBlockId,
      sliderAddonId: grabbed.sliderAddonId,
      templateBlockId: grabbed.templateBlockId,
      templateAddonId: grabbed.kind === 'templateAddon' ? grabbed.templateAddonId : undefined,
      layoutLimits: grabbed.kind === 'templateAddon' ? ADDON_LAYOUT_LIMITS : CONTENT_BLOCK_LAYOUT_LIMITS,
      startDocument: document,
      isRootBlock: false,
    }
  }

  const block = findBlock(document, grabbed.blockId)
  if (!block) return null
  const addon = grabbed.kind === 'addon' ? block.addons.find((item) => item.id === grabbed.addonId) : null
  if (grabbed.kind === 'addon' && !addon) return null
  const startLayout = addon ? addon.layout : block.layout
  const path = findBlockPath(document, block.id)
  const isRootBlock = path.length === 1
  return {
    handle,
    startRect: resolveLayoutRect(startLayout, breakpoint),
    parentWidth:
      grabbed.kind === 'addon'
        ? layoutParentWidth(document, block.id, canvasWidth, breakpoint, true)
        : layoutParentWidth(document, block.id, canvasWidth, breakpoint, false),
    scale,
    selection: grabbed,
    blockId: block.id,
    addonId: grabbed.kind === 'addon' ? grabbed.addonId : undefined,
    layoutLimits: grabbed.kind === 'addon' ? ADDON_LAYOUT_LIMITS : CONTENT_BLOCK_LAYOUT_LIMITS,
    startDocument: document,
    isRootBlock: grabbed.kind === 'block' && isRootBlock,
  }
}

export function dragSessionRect(
  drag: CanvasDragSession,
  deltaX: number,
  deltaY: number,
): LayoutRect {
  const handle = drag.handle === 'pinch' ? 'se' : drag.handle
  return pointerToRect(
    drag.startRect,
    deltaX / drag.scale,
    deltaY / drag.scale,
    drag.parentWidth,
    handle,
    drag.layoutLimits,
  )
}

export function pinchSessionRect(drag: CanvasDragSession, scaleX: number, scaleY: number): LayoutRect {
  return pinchToRect(drag.startRect, scaleX, scaleY, drag.parentWidth, drag.layoutLimits)
}

export function applyCanvasLayoutRect(
  drag: CanvasDragSession,
  nextRect: LayoutRect,
  breakpoint: WebsiteBreakpoint,
): WebsiteDocumentV1 {
  const nextBottom = nextRect.top + nextRect.height
  let nextDocument = drag.startDocument

  if (drag.selection.kind === 'block') {
    nextDocument = updateBlockById(drag.startDocument, drag.blockId, (item) => ({
      ...item,
      layout: writeLayoutRect(item.layout, breakpoint, nextRect, drag.layoutLimits),
    }))
    if (drag.isRootBlock) {
      nextDocument = {
        ...nextDocument,
        container: {
          ...nextDocument.container,
          height: Math.max(nextDocument.container.height, nextBottom + ROW_HEIGHT),
        },
      }
    }
  } else if (
    drag.selection.kind === 'templateBlock' &&
    drag.hostBlockId &&
    drag.sliderAddonId &&
    drag.templateBlockId
  ) {
    nextDocument = updateTemplateBlock(
      drag.startDocument,
      drag.hostBlockId,
      drag.sliderAddonId,
      drag.templateBlockId,
      (item) => ({
        ...item,
        layout: writeLayoutRect(item.layout, breakpoint, nextRect, drag.layoutLimits),
      }),
    )
  } else if (
    drag.selection.kind === 'templateAddon' &&
    drag.hostBlockId &&
    drag.sliderAddonId &&
    drag.templateBlockId &&
    drag.templateAddonId
  ) {
    const ctx = findSliderHostContext(drag.startDocument, drag.hostBlockId, drag.sliderAddonId)
    const templateBlock = ctx ? findBlockInTree(ctx.slideTemplate, drag.templateBlockId) : null
    const currentAddon = templateBlock?.addons.find((item) => item.id === drag.templateAddonId)
    if (currentAddon) {
      nextDocument = updateTemplateAddon(
        drag.startDocument,
        drag.hostBlockId,
        drag.sliderAddonId,
        drag.templateBlockId,
        {
          ...currentAddon,
          layout: writeLayoutRect(currentAddon.layout, breakpoint, nextRect, drag.layoutLimits),
        },
      )
    }
  } else if (drag.addonId) {
    nextDocument = updateBlockById(drag.startDocument, drag.blockId, (item) => ({
      ...item,
      addons: item.addons.map((child) =>
        child.id === drag.addonId
          ? { ...child, layout: writeLayoutRect(child.layout, breakpoint, nextRect, drag.layoutLimits) }
          : child,
      ),
    }))
  }

  return nextDocument
}

export function applyCanvasDragSession(
  drag: CanvasDragSession,
  deltaX: number,
  deltaY: number,
  breakpoint: WebsiteBreakpoint,
): WebsiteDocumentV1 {
  return applyCanvasLayoutRect(drag, dragSessionRect(drag, deltaX, deltaY), breakpoint)
}

export function applyCanvasPinchSession(
  drag: CanvasDragSession,
  scaleX: number,
  scaleY: number,
  breakpoint: WebsiteBreakpoint,
): WebsiteDocumentV1 {
  return applyCanvasLayoutRect(drag, pinchSessionRect(drag, scaleX, scaleY), breakpoint)
}
