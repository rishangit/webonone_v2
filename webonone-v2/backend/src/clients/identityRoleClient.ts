import { env } from '../config/env.js'

export type UserRoleType = 'super_admin' | 'company_admin' | 'member'

export type UserRoleRow = {
  id: string
  user_id: string
  role: UserRoleType
  company_id: string | null
  created_at: Date
  updated_at: Date
}

type IdentityRoleDto = {
  id: string
  userId: string
  role: UserRoleType
  companyId: string | null
  createdAt: string
  updatedAt: string
}

function apiBase(): string {
  if (!env.identityApiBaseUrl) {
    throw new Error('IDENTITY_API_BASE_URL not configured')
  }
  return env.identityApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function serviceHeaders(): Record<string, string> {
  if (!env.identityServiceApiKey) {
    throw new Error('IDENTITY_SERVICE_API_KEY not configured')
  }
  return {
    'Content-Type': 'application/json',
    'X-Identity-Service-Key': env.identityServiceApiKey,
  }
}

function mapRole(row: IdentityRoleDto): UserRoleRow {
  return {
    id: row.id,
    user_id: row.userId,
    role: row.role,
    company_id: row.companyId,
    created_at: new Date(row.createdAt),
    updated_at: new Date(row.updatedAt),
  }
}

async function listUserRoles(userId: string): Promise<UserRoleRow[]> {
  const res = await fetch(`${apiBase()}/api/v1/internal/roles/user/${encodeURIComponent(userId)}`, {
    headers: serviceHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Identity list roles failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { roles: IdentityRoleDto[] }
  return data.roles.map(mapRole)
}

export async function findSuperAdminByUserId(userId: string): Promise<UserRoleRow | undefined> {
  const roles = await listUserRoles(userId)
  return roles.find((row) => row.role === 'super_admin' && row.company_id == null)
}

export async function findCompanyRolesByUserId(userId: string): Promise<UserRoleRow[]> {
  const roles = await listUserRoles(userId)
  return roles.filter((row) => row.company_id != null).sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
}

export async function findPrimaryCompanyRole(userId: string): Promise<UserRoleRow | undefined> {
  const roles = await findCompanyRolesByUserId(userId)
  if (roles.length === 0) return undefined
  return roles.find((row) => row.role === 'company_admin') ?? roles[0]
}

export async function findCompanyRole(
  userId: string,
  companyId: string,
): Promise<UserRoleRow | undefined> {
  const roles = await findCompanyRolesByUserId(userId)
  return roles.find((row) => row.company_id === companyId)
}

export async function insertUserRole(
  row: Omit<UserRoleRow, 'created_at' | 'updated_at'>,
): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/internal/roles`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({
      id: row.id,
      userId: row.user_id,
      role: row.role,
      companyId: row.company_id,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Identity insert role failed (${res.status}): ${text}`)
  }
}

export async function upsertSuperAdminRole(userId: string, roleId: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/internal/roles/upsert-super-admin`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({ userId, roleId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Identity upsert super admin failed (${res.status}): ${text}`)
  }
}

export async function promoteUserToCompanyAdmin(companyId: string, userId: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/internal/roles/promote-company-admin`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({ companyId, userId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Identity promote failed (${res.status}): ${text}`)
  }
}

export async function demoteUserToMember(companyId: string, userId: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/internal/roles/demote-member`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({ companyId, userId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Identity demote failed (${res.status}): ${text}`)
  }
}
