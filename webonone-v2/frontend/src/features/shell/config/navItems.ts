import { Building2, Home, Palette, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getPlatformNavDefs,
  type CoreNavDef,
  type CoreNavLeaf,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

const ICON_BY_PATH: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
}

function iconForPath(path: string): LucideIcon {
  return ICON_BY_PATH[path] ?? Home
}

function buildNavItems(defs: CoreNavDef[]): NavConfigItem[] {
  return defs.map((item) => {
    if (item.kind === 'item') {
      return {
        type: 'item',
        to: item.path,
        label: item.label,
        icon: iconForPath(item.path),
      }
    }

    return {
      type: 'group',
      label: item.label,
      icon: GROUP_ICON_BY_LABEL[item.label] ?? Settings,
      children: item.children.map((child: CoreNavLeaf) => ({
        to: child.path,
        label: child.label,
        icon: iconForPath(child.path),
      })),
    }
  })
}

export function buildPlatformNav(variant: PlatformNavVariant): NavConfigItem[] {
  return buildNavItems(getPlatformNavDefs(variant))
}

export const mainNav = buildPlatformNav('main')
export const superAdminNav = buildPlatformNav('superAdmin')
