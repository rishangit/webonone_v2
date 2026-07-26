import {
  Building2,
  Database,
  History,
  Home,
  Layers,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Rows3,
  Ruler,
  Send,
  Settings,
  Shapes,
  Smartphone,
  Tag,
  Users,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DATA_NAV_SENTINELS,
  EMAIL_NAV_SENTINELS,
  IDENTITY_NAV_SENTINELS,
  SMS_NAV_SENTINELS,
  filterPlatformNavDataEntities,
  getPlatformNavDefs,
  isDataNavSentinel,
  isEmailNavSentinel,
  isIdentityNavSentinel,
  isProfileNavSentinel,
  isSmsNavSentinel,
  type CoreNavDef,
  type CoreNavLeaf,
  type DataEntityKey,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { SessionRole } from '@/features/session/types/sessionRole.types'

const ICON_BY_PATH: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  '/settings/companies': Building2,
  [IDENTITY_NAV_SENTINELS.users]: Users,
  [EMAIL_NAV_SENTINELS.send]: Send,
  [EMAIL_NAV_SENTINELS.queue]: Rows3,
  [EMAIL_NAV_SENTINELS.history]: History,
  [EMAIL_NAV_SENTINELS.templates]: Mail,
  [DATA_NAV_SENTINELS.tags]: Tag,
  [DATA_NAV_SENTINELS.units]: Ruler,
  [DATA_NAV_SENTINELS.attributes]: Shapes,
  [DATA_NAV_SENTINELS.products]: Package,
  [DATA_NAV_SENTINELS.services]: Wrench,
  [DATA_NAV_SENTINELS.spaces]: Layers,
  [SMS_NAV_SENTINELS.send]: Send,
  [SMS_NAV_SENTINELS.devices]: Smartphone,
  [SMS_NAV_SENTINELS.queue]: Rows3,
  [SMS_NAV_SENTINELS.history]: History,
  [SMS_NAV_SENTINELS.templates]: MessageSquare,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
  Identity: Users,
  Email: Mail,
  Data: Database,
  SMS: MessageSquare,
}

function iconForPath(path: string): LucideIcon {
  return ICON_BY_PATH[path] ?? Home
}

function resolveItemPath(item: CoreNavLeaf): string {
  if (
    item.externalService === 'email' ||
    item.externalService === 'data' ||
    item.externalService === 'sms'
  ) {
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

export function buildPlatformNav(
  variant: PlatformNavVariant,
  dataEntities?: readonly DataEntityKey[],
): NavConfigItem[] {
  let defs = getPlatformNavDefs(variant)
  if (variant === 'main' && dataEntities !== undefined) {
    defs = filterPlatformNavDataEntities(defs, dataEntities)
  }
  return buildNavItems(defs)
}

export function sessionRoleToNavVariant(role: SessionRole): PlatformNavVariant {
  if (role === 'super_admin') return 'superAdmin'
  if (role === 'company_admin') return 'main'
  return 'member'
}

export function buildNavForSessionRole(
  role: SessionRole,
  dataEntities?: readonly DataEntityKey[],
): NavConfigItem[] {
  const variant = sessionRoleToNavVariant(role)
  if (role === 'company_admin') {
    return buildPlatformNav(variant, dataEntities ?? [])
  }
  return buildPlatformNav(variant)
}

export const mainNav = buildPlatformNav('main')
export const superAdminNav = buildPlatformNav('superAdmin')
export const memberNav = buildPlatformNav('member')

export {
  isEmailNavSentinel,
  isDataNavSentinel,
  isIdentityNavSentinel,
  isProfileNavSentinel,
  isSmsNavSentinel,
}
