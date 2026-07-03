import { Building2, History, Home, Mail, Palette, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DATA_NAV_SENTINELS,
  EMAIL_NAV_SENTINELS,
  getPlatformNavDefs,
  isDataNavSentinel,
  isEmailNavSentinel,
  type CoreNavDef,
  type CoreNavLeaf,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { SessionRole } from '@/features/session/types/sessionRole.types'

const ICON_BY_PATH: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  [EMAIL_NAV_SENTINELS.history]: History,
  [EMAIL_NAV_SENTINELS.templates]: Mail,
  [DATA_NAV_SENTINELS.dashboard]: Home,
  [DATA_NAV_SENTINELS.tags]: Mail,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
  Email: Mail,
  Data: Mail,
}

function iconForPath(path: string): LucideIcon {
  return ICON_BY_PATH[path] ?? Home
}

function resolveItemPath(item: CoreNavLeaf): string {
  if (item.externalService === 'email' || item.externalService === 'data') {
    return item.path
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

export function sessionRoleToNavVariant(role: SessionRole): PlatformNavVariant {
  if (role === 'super_admin') return 'superAdmin'
  if (role === 'company_admin') return 'main'
  return 'member'
}

export function buildNavForSessionRole(role: SessionRole): NavConfigItem[] {
  return buildPlatformNav(sessionRoleToNavVariant(role))
}

export const mainNav = buildPlatformNav('main')
export const superAdminNav = buildPlatformNav('superAdmin')
export const memberNav = buildPlatformNav('member')

export { isEmailNavSentinel, isDataNavSentinel }
