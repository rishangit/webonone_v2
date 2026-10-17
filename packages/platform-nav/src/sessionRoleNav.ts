import {
  SMS_NAV_SENTINELS,
  filterCompanyDataEntities,
  filterPlatformNavDataEntities,
  getPlatformNavDefs,
  type CoreNavDef,
  type CoreNavLeaf,
  type DataEntityKey,
  type PlatformNavVariant,
} from './coreNav'

export type SessionRole = 'super_admin' | 'company_admin' | 'member'

/** Identity/Data groups and Forms/Website stay staff/company-session only. Default User keeps Calendar. */
export const COMPANY_SESSION_ONLY_GROUPS = new Set(['Identity', 'Data'])

/** Top-level leaves hidden for a member with no company. */
export const COMPANY_SESSION_ONLY_ITEMS = new Set(['Forms', 'Website'])

export function sessionRoleToNavVariant(role: SessionRole): PlatformNavVariant {
  if (role === 'super_admin') return 'superAdmin'
  if (role === 'company_admin') return 'main'
  return 'member'
}

export function withoutCompanySessionOnlyGroups(defs: CoreNavDef[]): CoreNavDef[] {
  return defs.filter((item) => {
    if (item.kind === 'group' && COMPANY_SESSION_ONLY_GROUPS.has(item.label)) return false
    if (item.kind === 'item' && COMPANY_SESSION_ONLY_ITEMS.has(item.label)) return false
    return true
  })
}

/**
 * Role-filtered platform nav defs (paths + labels only). Clients map icons.
 * `company_admin` / company `member` filter Data children by enabled catalog entities.
 * Default User (`member` with no company) drops Identity, Data, Forms, and Website.
 */
export function buildNavDefsForSessionRole(
  role: SessionRole,
  dataEntities?: readonly DataEntityKey[],
  companyId?: string | null,
): CoreNavDef[] {
  const variant = sessionRoleToNavVariant(role)
  if (role === 'company_admin') {
    return filterPlatformNavDataEntities(
      getPlatformNavDefs(variant),
      filterCompanyDataEntities(dataEntities ?? []),
    )
  }
  if (role === 'member' && !companyId) {
    return withoutCompanySessionOnlyGroups(getPlatformNavDefs('member'))
  }
  if (role === 'member') {
    return filterPlatformNavDataEntities(
      getPlatformNavDefs(variant),
      filterCompanyDataEntities(dataEntities ?? []),
    )
  }
  return getPlatformNavDefs(variant)
}

/** Mobile-only leaf under SMS — this phone as a gateway. Not shown on web. */
export const MOBILE_SMS_THIS_DEVICE_NAV: CoreNavLeaf = {
  kind: 'item',
  path: SMS_NAV_SENTINELS.gateway,
  label: 'This device',
  externalService: 'sms',
  externalPath: '/gateway',
}

/** Insert **This device** after Devices in the SMS group (mobile client only). */
export function appendMobileSmsThisDeviceNav(defs: CoreNavDef[]): CoreNavDef[] {
  return defs.map((item) => {
    if (item.kind !== 'group' || item.label !== 'SMS') {
      return item
    }
    if (item.children.some((child) => child.path === SMS_NAV_SENTINELS.gateway)) {
      return item
    }
    const devicesIndex = item.children.findIndex(
      (child) => child.path === SMS_NAV_SENTINELS.devices,
    )
    const children = [...item.children]
    children.splice(
      devicesIndex >= 0 ? devicesIndex + 1 : children.length,
      0,
      MOBILE_SMS_THIS_DEVICE_NAV,
    )
    return { ...item, children }
  })
}
