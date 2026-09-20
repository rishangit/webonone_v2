import { ADDON_DEFAULTS, addonTypesForKind } from '@/features/design/website/addons/defaults'
import type { WebsiteAddon, WebsiteDesignerKind } from '@/features/design/website/types'

export function getAddonModuleByType(type: WebsiteAddon['type']) {
  const createDefaultAddon = ADDON_DEFAULTS[type]
  if (!createDefaultAddon) return undefined
  return { type, createDefaultAddon }
}

export function getAddonModulesForKind(kind?: WebsiteDesignerKind): Set<WebsiteAddon['type']> {
  return new Set(addonTypesForKind(kind))
}
