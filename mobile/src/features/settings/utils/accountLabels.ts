import type { TFunction } from 'i18next'
import type { SessionRoleOption } from '@/features/auth/sessionRoleApi'
import type { SessionRole } from '@/shared/types'

export function accountDescription(option: SessionRoleOption, t: TFunction): string {
  if (option.accountKind === 'staff' || (option.role === 'member' && option.companyId)) {
    return option.companyName
      ? t('descriptions.staffNamed', { companyName: option.companyName })
      : t('descriptions.staff')
  }

  switch (option.role) {
    case 'super_admin':
      return t('descriptions.superAdmin')
    case 'company_admin':
      return option.companyName
        ? t('descriptions.companyOwnerNamed', { companyName: option.companyName })
        : t('descriptions.companyOwner')
    default:
      return t('descriptions.defaultUser')
  }
}

export function findMatchingSessionRoleOption(
  options: SessionRoleOption[],
  role: SessionRole,
  companyId: string | null,
): SessionRoleOption | null {
  return options.find((option) => option.role === role && (option.companyId ?? null) === companyId) ?? null
}

export function accountTitle(option: SessionRoleOption, t: TFunction): string {
  if (option.role === 'super_admin') return t('roles.superAdmin')
  return option.companyName ?? option.label
}

export function fallbackAccountLabel(role: SessionRole, companyId: string | null, t: TFunction): string {
  if (role === 'super_admin') return t('roles.superAdmin')
  if (role === 'company_admin') return t('roles.companyOwner')
  if (role === 'member' && companyId) return t('roles.staff')
  return t('roles.defaultUser')
}
