import type { WebsiteDocumentV1, WebsiteLayout, WebsiteTheme } from '../types'
import { findBlockPath } from './blockTree'
import { findBlockPathInTree } from './contentTreeModel'
import { findSliderHostContext } from './slider'

export function explicitPaletteId(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Own palette when set. Otherwise the parent palette. Null means keep each style's palette. */
export function inheritPaletteId(
  own: string | null | undefined,
  parent: string | null | undefined,
): string | null {
  return explicitPaletteId(own) ?? explicitPaletteId(parent)
}

export function chainPalette(
  start: string | null | undefined,
  nodes: Array<{ colorPaletteId?: string | null }>,
): string | null {
  return nodes.reduce<string | null>(
    (parent, node) => inheritPaletteId(node.colorPaletteId, parent),
    explicitPaletteId(start),
  )
}

function paletteAtSlider(
  document: WebsiteDocumentV1,
  hostBlockId: string,
  sliderAddonId: string,
  rootPaletteId: string | null | undefined,
): string | null {
  const path = findBlockPath(document, hostBlockId)
  const host = path.at(-1)
  const slider = host?.addons.find((addon) => addon.id === sliderAddonId)
  return inheritPaletteId(slider?.colorPaletteId, chainPalette(rootPaletteId, path))
}

/** Palette inherited by a block, excluding the block's own choice. */
export function paletteInheritedByBlock(
  document: WebsiteDocumentV1,
  blockId: string,
  rootPaletteId: string | null | undefined,
  template?: { hostBlockId: string; sliderAddonId: string },
): string | null {
  if (template) {
    const base = paletteAtSlider(document, template.hostBlockId, template.sliderAddonId, rootPaletteId)
    const ctx = findSliderHostContext(document, template.hostBlockId, template.sliderAddonId)
    if (!ctx) return base
    return chainPalette(base, findBlockPathInTree(ctx.slideTemplate, blockId).slice(0, -1))
  }
  return chainPalette(rootPaletteId, findBlockPath(document, blockId).slice(0, -1))
}

/** Palette inherited by an add-on, including its host block and excluding the add-on itself. */
export function paletteInheritedByAddon(
  document: WebsiteDocumentV1,
  blockId: string,
  rootPaletteId: string | null | undefined,
  template?: { sliderAddonId: string; templateBlockId: string },
): string | null {
  if (template) {
    const base = paletteAtSlider(document, blockId, template.sliderAddonId, rootPaletteId)
    const ctx = findSliderHostContext(document, blockId, template.sliderAddonId)
    if (!ctx) return base
    return chainPalette(base, findBlockPathInTree(ctx.slideTemplate, template.templateBlockId))
  }
  return chainPalette(rootPaletteId, findBlockPath(document, blockId))
}

export function themeForLayout(
  layoutId: string | null | undefined,
  layouts: Pick<WebsiteLayout, 'id' | 'themeId'>[],
  themes: WebsiteTheme[],
): WebsiteTheme | null {
  const layout = layouts.find((item) => item.id === layoutId)
  return (
    themes.find((item) => item.id === layout?.themeId) ??
    themes.find((item) => item.isDefault) ??
    themes[0] ??
    null
  )
}

export function defaultWebsiteTheme(themes: WebsiteTheme[]): WebsiteTheme | null {
  return themes.find((item) => item.isDefault) ?? themes[0] ?? null
}
