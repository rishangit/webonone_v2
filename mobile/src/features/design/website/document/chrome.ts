import type { LayoutRect } from '@/features/design/website/types'
import type {
  ElementBorderRadius,
  ElementBoxShadow,
  ElementChrome,
  ElementMargin,
  ElementPadding,
} from '@/features/design/website/types'
import { rectToStyle } from '@/features/design/website/document/layout'

export const MARGIN_PX: Record<ElementMargin, number> = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
}

const PADDING_PX: Record<ElementPadding, number> = {
  1: 4,
  2: 8,
  3: 12,
}

const RADIUS_PX: Record<ElementBorderRadius, number> = {
  sm: 2,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
}

export function pickElementChrome(item: ElementChrome): ElementChrome {
  return {
    backgroundColor: item.backgroundColor,
    borderColor: item.borderColor,
    borderRadius: item.borderRadius,
    boxShadow: item.boxShadow,
    padding: item.padding,
    margin: item.margin,
  }
}

export function chromeBoxStyle(rect: LayoutRect, chrome?: ElementChrome) {
  const margin = chrome?.margin ? MARGIN_PX[chrome.margin] : 0
  const padding = chrome?.padding ? PADDING_PX[chrome.padding] : 0
  const radius = chrome?.borderRadius ? RADIUS_PX[chrome.borderRadius] : 0
  const style = rectToStyle(rect)
  return {
    ...style,
    margin,
    padding,
    borderRadius: radius,
    backgroundColor: chrome?.backgroundColor,
    borderColor: chrome?.borderColor,
    borderWidth: chrome?.borderColor ? 1 : 0,
    overflow: 'hidden' as const,
    shadowOpacity: chrome?.boxShadow ? 0.18 : 0,
    elevation: chrome?.boxShadow === 'lg' ? 6 : chrome?.boxShadow === 'md' ? 4 : chrome?.boxShadow ? 2 : 0,
  }
}

export function chromeInlineStyle(chrome?: ElementChrome) {
  return chromeBoxStyle({ col: 1, colSpan: 12, top: 0, height: 0 }, chrome)
}

/** Chrome colors/spacing without absolute layout — for RN nested fill views. */
export function chromeFillStyle(chrome?: ElementChrome) {
  const margin = chrome?.margin ? MARGIN_PX[chrome.margin] : 0
  const padding = chrome?.padding ? PADDING_PX[chrome.padding] : 0
  const radius = chrome?.borderRadius ? RADIUS_PX[chrome.borderRadius] : 0
  return {
    margin,
    padding,
    borderRadius: radius,
    backgroundColor: chrome?.backgroundColor,
    borderColor: chrome?.borderColor,
    borderWidth: chrome?.borderColor ? 1 : 0,
    overflow: 'hidden' as const,
    shadowOpacity: chrome?.boxShadow ? 0.18 : 0,
    elevation: chrome?.boxShadow === 'lg' ? 6 : chrome?.boxShadow === 'md' ? 4 : chrome?.boxShadow ? 2 : 0,
  }
}
