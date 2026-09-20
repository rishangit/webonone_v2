import {
  appendMobileSmsThisDeviceNav,
  buildNavDefsForSessionRole,
  type CoreNavDef,
  type DataEntityKey,
  type SessionRole,
} from '@webonone/platform-nav'
import type { MobileNavItem } from '@webonone/mobile-ui'
import { iconForNavGroup, iconForNavPath } from './navIcons'

function toMobileNav(defs: CoreNavDef[]): MobileNavItem[] {
  return defs.map((item) => {
    if (item.kind === 'item') {
      return {
        type: 'item',
        to: item.path,
        label: item.label,
        icon: iconForNavPath(item.path),
      }
    }
    return {
      type: 'group',
      label: item.label,
      icon: iconForNavGroup(item.label),
      children: item.children.map((child) => ({
        type: 'item' as const,
        to: child.path,
        label: child.label,
        icon: iconForNavPath(child.path),
      })),
    }
  })
}

export function buildMobileNavForSessionRole(
  role: SessionRole,
  dataEntities?: readonly DataEntityKey[],
  companyId?: string | null,
): MobileNavItem[] {
  const defs = appendMobileSmsThisDeviceNav(
    buildNavDefsForSessionRole(role, dataEntities, companyId),
  )
  return toMobileNav(defs)
}
