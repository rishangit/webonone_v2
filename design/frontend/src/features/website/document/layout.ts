import type { CSSProperties } from 'react'
import type { LayoutByBreakpoint, LayoutRect, WebsiteBreakpoint } from '../types'
import { WEBSITE_BREAKPOINTS } from '../types'

export const MIN_CONTENT_BLOCK_COL_SPAN = 4
export const MIN_CONTENT_BLOCK_HEIGHT = 80
export const DEFAULT_CONTENT_BLOCK_COL_SPAN = 4
export const DEFAULT_CONTENT_BLOCK_HEIGHT = 160

export const CONTENT_BLOCK_LAYOUT_LIMITS = {
  minColSpan: MIN_CONTENT_BLOCK_COL_SPAN,
  minHeight: MIN_CONTENT_BLOCK_HEIGHT,
} as const

export const ADDON_LAYOUT_LIMITS = {
  minColSpan: 1,
  minHeight: 24,
} as const

export type LayoutLimits = {
  minColSpan: number
  minHeight: number
}

export function resolveLayoutRect(layout: LayoutByBreakpoint, breakpoint: WebsiteBreakpoint): LayoutRect {
  const start = WEBSITE_BREAKPOINTS.indexOf(breakpoint)
  for (let i = start; i < WEBSITE_BREAKPOINTS.length; i += 1) {
    const key = WEBSITE_BREAKPOINTS[i]
    const rect = layout[key]
    if (rect) return rect
  }
  return layout['2xl']
}

export function writeLayoutRect(
  layout: LayoutByBreakpoint,
  breakpoint: WebsiteBreakpoint,
  rect: LayoutRect,
  limits: LayoutLimits = ADDON_LAYOUT_LIMITS,
): LayoutByBreakpoint {
  const next = clampRect(rect, limits)
  if (breakpoint === '2xl') {
    return { ...layout, '2xl': next }
  }
  return { ...layout, [breakpoint]: next }
}

export function clampRect(rect: LayoutRect, limits: LayoutLimits = ADDON_LAYOUT_LIMITS): LayoutRect {
  const colSpan = Math.min(12, Math.max(limits.minColSpan, Math.round(rect.colSpan)))
  const col = Math.min(13 - colSpan, Math.max(1, Math.round(rect.col)))
  return {
    col,
    colSpan,
    top: Math.max(0, Math.round(rect.top)),
    height: Math.max(limits.minHeight, Math.round(rect.height)),
  }
}

export function rectToStyle(rect: LayoutRect): CSSProperties {
  return {
    position: 'absolute',
    boxSizing: 'border-box',
    left: `${((rect.col - 1) / 12) * 100}%`,
    width: `${(rect.colSpan / 12) * 100}%`,
    top: `${rect.top}px`,
    height: `${rect.height}px`,
  }
}

export function pointerToRect(
  start: LayoutRect,
  deltaX: number,
  deltaY: number,
  canvasWidth: number,
  handle: ResizeHandle | 'move',
  limits: LayoutLimits = ADDON_LAYOUT_LIMITS,
): LayoutRect {
  const colWidth = canvasWidth / 12
  const minWidth = colWidth * limits.minColSpan
  const startLeft = (start.col - 1) * colWidth
  const startWidth = start.colSpan * colWidth
  let left = startLeft
  let top = start.top
  let width = startWidth
  let height = start.height

  if (handle === 'move') {
    left = startLeft + deltaX
    top = start.top + deltaY
  } else {
    if (handle.includes('w')) left = startLeft + deltaX
    if (handle.includes('e')) width = startWidth + deltaX
    if (handle.includes('w')) width = startWidth - deltaX
    if (handle.includes('n')) top = start.top + deltaY
    if (handle.includes('s')) height = start.height + deltaY
    if (handle.includes('n')) height = start.height - deltaY
  }

  width = Math.max(minWidth, width)
  height = Math.max(limits.minHeight, height)
  const col = Math.round(left / colWidth) + 1
  const colSpan = Math.round(width / colWidth)
  return clampRect({ col, colSpan, top, height }, limits)
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
export const RESIZE_HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

export function resizeHandleClassName(handle: ResizeHandle, kind: 'block' | 'addon' = 'block'): string {
  const edgeHover = kind === 'addon' ? 'hover:bg-accent/40' : 'hover:bg-primary/40'
  const cornerHover = kind === 'addon' ? 'hover:bg-accent/70' : 'hover:bg-primary/70'
  const hover = handle.length === 1 ? edgeHover : cornerHover
  const base = `pointer-events-auto absolute z-[30] box-border min-w-0 border-0 bg-transparent p-0 ${hover}`
  if (handle === 'n') return `${base} left-0 right-0 top-0 h-4 w-auto cursor-ns-resize`
  if (handle === 's') return `${base} bottom-0 left-0 right-0 h-4 w-auto cursor-ns-resize`
  if (handle === 'e') return `${base} bottom-0 right-0 top-0 h-auto w-4 cursor-ew-resize`
  if (handle === 'w') return `${base} bottom-0 left-0 top-0 h-auto w-4 cursor-ew-resize`
  if (handle === 'ne') return `${base} right-0 top-0 h-5 w-5 cursor-nesw-resize rounded-bl`
  if (handle === 'nw') return `${base} left-0 top-0 h-5 w-5 cursor-nwse-resize rounded-br`
  if (handle === 'se') return `${base} bottom-0 right-0 h-5 w-5 cursor-nwse-resize rounded-tl`
  return `${base} bottom-0 left-0 h-5 w-5 cursor-nesw-resize rounded-tr`
}
