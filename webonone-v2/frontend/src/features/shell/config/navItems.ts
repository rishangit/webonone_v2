import { Building2, Home, Mail, Palette, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getPlatformNavDefs,
  type CoreNavDef,
  type CoreNavLeaf,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

/** Internal sentinel for Email nav — handled via `onClick` in AppLayout (not routed). */
export const PLATFORM_EMAIL_NAV = '/email'

const ICON_BY_PATH: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  [PLATFORM_EMAIL_NAV]: Mail,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
}

function iconForPath(path: string): LucideIcon {
  return ICON_BY_PATH[path] ?? Home
}

function resolveItemPath(item: CoreNavLeaf): string {
  if (item.externalService === 'email') {
    return PLATFORM_EMAIL_NAV
  }
  return item.path
}

function buildNavItems(defs: CoreNavDef[]): NavConfigItem[] {
  return defs.map((item) => {
    if (item.kind === 'item') {
      return {
        type: 'item',
        to: resolveItemPath(item),
        label: item.label,
        icon: iconForPath(item.path),
      }
    }

    return {
      type: 'group',
      label: item.label,
      icon: GROUP_ICON_BY_LABEL[item.label] ?? Settings,
      children: item.children.map((child: CoreNavLeaf) => ({
        to: resolveItemPath(child),
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
