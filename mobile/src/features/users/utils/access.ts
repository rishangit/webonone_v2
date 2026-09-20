import type { UserProfile } from '@/shared/types'

export function isSuperAdminUser(user: UserProfile | null | undefined): boolean {
  return user?.role === 'super_admin'
}

export function canAccessCompanyCustomers(user: UserProfile | null | undefined): boolean {
  if (!user?.companyId) return false
  return user.role === 'company_admin' || user.role === 'member'
}

export function canQueryUsers(user: UserProfile | null | undefined): boolean {
  return isSuperAdminUser(user) || canAccessCompanyCustomers(user)
}
