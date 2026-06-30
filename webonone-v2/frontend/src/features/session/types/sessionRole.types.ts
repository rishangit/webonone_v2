export type SessionRole = 'super_admin' | 'company_admin' | 'member'

export type AssumableRoleOption = {
  role: SessionRole
  companyId: string | null
  label: string
  companyName?: string
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  hasCompanyMembership: boolean
}
