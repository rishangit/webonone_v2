import type { DataEntityKey } from '@webonone/platform-nav'

export type SessionRole = 'super_admin' | 'company_admin' | 'member'

export type AssumableRoleOption = {
  role: SessionRole
  companyId: string | null
  label: string
  companyName?: string
  companyLogoUrl?: string | null
  dataEntities?: DataEntityKey[]
  /** Present when this company card is from company_staff (not owner). */
  accountKind?: 'staff'
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  /** True when Super Admin, owned companies, and/or staff companies — show Choose account dialog */
  requiresAccountSelection: boolean
  /** Compat: true when user owns ≥1 pending/approved company */
  hasCompanyMembership: boolean
}
