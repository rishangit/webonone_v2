import type { CSSProperties } from 'react'
import { cn } from '@webonone/ui-kit'
import type { LayoutRect } from '../types'
import type {
  ElementBorderRadius,
  ElementBoxShadow,
  ElementChrome,
  ElementMargin,
  ElementPadding,
} from '../types'
import { rectToStyle } from './layout'

const PADDING_CLASS: Record<ElementPadding, string> = {
  1: 'p-1',
  2: 'p-2',
  3: 'p-3',
}

/** Tailwind spacing scale in px (rem root 16). Applied as inset so layout width stays fixed. */
export const MARGIN_PX: Record<ElementMargin, number> = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
}

const RADIUS_CLASS: Record<ElementBorderRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

const SHADOW_CLASS: Record<ElementBoxShadow, string> = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
}

export function pickElementChrome(source: ElementChrome): ElementChrome {
  return {
    backgroundColor: source.backgroundColor,
    borderColor: source.borderColor,
    borderRadius: source.borderRadius,
    boxShadow: source.boxShadow,
    padding: source.padding,
    margin: source.margin,
  }
}

export function chromeClassName(chrome: ElementChrome): string {
  return cn(
    chrome.padding != null ? PADDING_CLASS[chrome.padding] : undefined,
    chrome.borderRadius ? RADIUS_CLASS[chrome.borderRadius] : undefined,
    chrome.boxShadow ? SHADOW_CLASS[chrome.boxShadow] : undefined,
  )
}

export function chromeInlineStyle(chrome: ElementChrome): CSSProperties {
  return {
    backgroundColor: chrome.backgroundColor || undefined,
    border: chrome.borderColor ? `1px solid ${chrome.borderColor}` : undefined,
  }
}

/**
 * Absolute layout for a block/addon. Margin insets the box inside the layout rect
 * so total occupied width/height never exceeds the designer slot.
 */
export function chromeBoxStyle(rect: LayoutRect, chrome: ElementChrome): CSSProperties {
  const base = rectToStyle(rect)
  const m = chrome.margin != null ? MARGIN_PX[chrome.margin] : 0
  if (!m) return base
  const leftPct = ((rect.col - 1) / 12) * 100
  const widthPct = (rect.colSpan / 12) * 100
  return {
    ...base,
    top: `${rect.top + m}px`,
    height: `${Math.max(0, rect.height - 2 * m)}px`,
    left: `calc(${leftPct}% + ${m}px)`,
    width: `calc(${widthPct}% - ${2 * m}px)`,
  }
}
