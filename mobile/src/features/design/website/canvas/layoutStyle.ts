import { chromeFillStyle } from '@/features/design/website/document/chrome'
import { WEBSITE_CANVAS_WIDTH } from '@/features/design/website/types'
import type { ElementChrome, LayoutRect, WebsiteBreakpoint } from '@/features/design/website/types'

export function canvasScale(canvasWidth: number, breakpoint: WebsiteBreakpoint): number {
  return canvasWidth / WEBSITE_CANVAS_WIDTH[breakpoint]
}

export function layoutRectStyle(
  rect: LayoutRect,
  parentWidth: number,
  scale: number,
  zIndex = 0,
): {
  position: 'absolute'
  left: number
  top: number
  width: number
  height: number
  zIndex: number
} {
  return {
    position: 'absolute',
    left: ((rect.col - 1) / 12) * parentWidth,
    top: rect.top * scale,
    width: (rect.colSpan / 12) * parentWidth,
    height: rect.height * scale,
    zIndex,
  }
}

export function elementChromeStyle(chrome?: ElementChrome) {
  return chromeFillStyle(chrome)
}
