import {
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  Database,
  Globe,
  History,
  Home,
  Layers,
  LayoutDashboard,
  List,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Receipt,
  Rows3,
  Ruler,
  Send,
  Settings,
  Shapes,
  ShoppingCart,
  Smartphone,
  Tag,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DATA_NAV_SENTINELS,
  DESIGN_NAV_SENTINELS,
  EMAIL_NAV_SENTINELS,
  IDENTITY_NAV_SENTINELS,
  PAYMENT_NAV_SENTINELS,
  SMS_NAV_SENTINELS,
  filterCompanyDataEntities,
  filterPlatformNavDataEntities,
  getPlatformNavDefs,
  isDataNavSentinel,
  isDesignNavSentinel,
  isEmailNavSentinel,
  isIdentityNavSentinel,
  isPaymentNavSentinel,
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
  '/': LayoutDashboard,
  '/analytics': BarChart3,
  '/calendar/schedule': CalendarDays,
  '/calendar/events': List,
  '/companies': Building2,
  '/settings/companies': Building2,
  '/settings/connected-companies': Building2,
  '/staff': Users,
  '/sales/pos': ShoppingCart,
  '/sales': Receipt,
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
  [PAYMENT_NAV_SENTINELS.invoices]: Wallet,
  [DESIGN_NAV_SENTINELS.forms]: Palette,
  [DESIGN_NAV_SENTINELS.website]: Globe,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
  Companies: Building2,
  Identity: Users,
  Email: Mail,
  Data: Database,
  SMS: MessageSquare,
  Payment: Wallet,
  Sales: ShoppingCart,
  Design: Palette,
  Calendar: Calendar,
}

function iconForPath(path: string): LucideIcon {
  return ICON_BY_PATH[path] ?? Home
}

function resolveItemPath(item: CoreNavLeaf): string {
  if (
    item.externalService === 'email' ||
    item.externalService === 'data' ||
    item.externalService === 'sms' ||
    item.externalService === 'payment' ||
    item.externalService === 'design'
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
  if ((variant === 'main' || variant === 'member') && dataEntities !== undefined) {
    defs = filterPlatformNavDataEntities(defs, filterCompanyDataEntities(dataEntities))
  }
  return buildNavItems(defs)
}

/** Identity/Data/Design remain staff/company-session only. Default User keeps Calendar. */
const COMPANY_SESSION_ONLY_GROUPS = new Set(['Identity', 'Data', 'Design'])

function withoutCompanySessionOnlyGroups(defs: CoreNavDef[]): CoreNavDef[] {
  return defs.filter(
    (item) => !(item.kind === 'group' && COMPANY_SESSION_ONLY_GROUPS.has(item.label)),
  )
}

export function sessionRoleToNavVariant(role: SessionRole): PlatformNavVariant {
  if (role === 'super_admin') return 'superAdmin'
  if (role === 'company_admin') return 'main'
  return 'member'
}

export function buildNavForSessionRole(
  role: SessionRole,
  dataEntities?: readonly DataEntityKey[],
  companyId?: string | null,
): NavConfigItem[] {
  const variant = sessionRoleToNavVariant(role)
  if (role === 'company_admin') {
    return buildPlatformNav(variant, dataEntities ?? [])
  }
  // Default User (member, no company) — Calendar + Settings; Identity/Data need a company session.
  if (role === 'member' && !companyId) {
    return buildNavItems(withoutCompanySessionOnlyGroups(getPlatformNavDefs('member')))
  }
  if (role === 'member') {
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
  isPaymentNavSentinel,
  isDesignNavSentinel,
}
