export type SessionRole = 'super_admin' | 'company_admin' | 'member'

export type AssumableRoleOption = {
  role: SessionRole
  companyId: string | null
  label: string
  companyName?: string
  companyLogoUrl?: string | null
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  /** True when Super Admin and/or owned companies — show Choose account dialog */
  requiresAccountSelection: boolean
  /** Compat: true when user owns ≥1 pending/approved company */
  hasCompanyMembership: boolean
}
