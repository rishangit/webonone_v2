import type { AssumableRoleOption, SessionRole } from '../types/sessionRole.types'

export function accountDescription(
  option: Pick<AssumableRoleOption, 'role' | 'companyName' | 'accountKind' | 'companyId'>,
): string {
  if (option.accountKind === 'staff' || (option.role === 'member' && option.companyId)) {
    return option.companyName
      ? `Staff — work as staff for ${option.companyName}.`
      : 'Staff — work as staff for this company.'
  }

  switch (option.role) {
    case 'super_admin':
      return 'Platform operator — Companies nav and system-wide Email access.'
    case 'company_admin':
      return option.companyName
        ? `Company Owner — manage ${option.companyName} (Email history and templates).`
        : 'Company Owner — company Email history and templates.'
    default:
      return 'Standard user account for this session.'
  }
}

export function findDefaultUser(roles: AssumableRoleOption[]): AssumableRoleOption | null {
  return roles.find((r) => r.role === 'member' && r.companyId === null) ?? null
}

export function findMatchingRole(
  roles: AssumableRoleOption[],
  role: SessionRole | null,
  companyId: string | null,
): AssumableRoleOption | null {
  if (!role) {
    return null
  }
  return (
    roles.find((r) => r.role === role && (r.companyId ?? null) === (companyId ?? null)) ?? null
  )
}

export function fallbackAccountLabel(role: SessionRole | null, companyId: string | null): string {
  if (role === 'super_admin') {
    return 'Super Admin'
  }
  if (role === 'company_admin') {
    return 'Company Owner'
  }
  if (role === 'member' && companyId) {
    return 'Staff'
  }
  return 'Default User'
}
