import * as roleRepo from '../repositories/userRole.repository.js'

export type PlatformRole = roleRepo.UserRoleType

export type AssumableRoleOption = {
  role: PlatformRole
  companyId: string | null
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  hasCompanyMembership: boolean
}

export async function getAssumableRoles(userId: string): Promise<AssumableRolesResponse> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  const primaryRole = await roleRepo.findPrimaryCompanyRole(userId)

  if (!primaryRole?.company_id) {
    if (superAdmin) {
      return {
        roles: [{ role: 'super_admin', companyId: null }],
        hasCompanyMembership: false,
      }
    }
    return {
      roles: [{ role: 'member', companyId: null }],
      hasCompanyMembership: false,
    }
  }

  const companyId = primaryRole.company_id
  const roles: AssumableRoleOption[] = []

  if (superAdmin) {
    roles.push({ role: 'super_admin', companyId: null })
  }

  const companyRoles = await roleRepo.findCompanyRolesByUserId(userId)
  const hasCompanyAdmin = companyRoles.some(
    (row) => row.company_id === companyId && row.role === 'company_admin',
  )
  if (hasCompanyAdmin) {
    roles.push({ role: 'company_admin', companyId })
  }

  roles.push({ role: 'member', companyId })

  return { roles, hasCompanyMembership: true }
}

export async function assertCanAssumeSessionRole(
  userId: string,
  sessionRole: PlatformRole,
  companyId?: string | null,
): Promise<void> {
  // Default User is always allowed (no company scope)
  if (sessionRole === 'member' && (companyId == null || companyId === '')) {
    return
  }

  if (sessionRole === 'super_admin') {
    const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
    if (superAdmin) return
  }

  if (sessionRole === 'company_admin' && companyId) {
    const companyRoles = await roleRepo.findCompanyRolesByUserId(userId)
    const ownsCompany = companyRoles.some(
      (row) => row.company_id === companyId && row.role === 'company_admin',
    )
    if (ownsCompany) return
  }

  if (sessionRole === 'member' && companyId) {
    const companyRole = await roleRepo.findCompanyRole(userId, companyId)
    if (companyRole) return
  }

  const err = new Error('Invalid session role for this user') as Error & { statusCode?: number }
  err.statusCode = 403
  throw err
}

export async function resolveDefaultSessionClaims(userId: string): Promise<{
  platformRole: PlatformRole
  companyId: string | null
} | null> {
  const assumable = await getAssumableRoles(userId)
  const superAdminOption = assumable.roles.find((option) => option.role === 'super_admin')
  if (superAdminOption) {
    return {
      platformRole: superAdminOption.role,
      companyId: superAdminOption.companyId,
    }
  }
  if (assumable.roles.length === 1) {
    const only = assumable.roles[0]
    return {
      platformRole: only.role,
      companyId: only.companyId,
    }
  }
  return null
}
