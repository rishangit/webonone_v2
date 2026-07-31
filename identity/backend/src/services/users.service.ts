import { findUserById, toUserProfile, type UserProfile } from '../models/user.repository.js'
import { listRolesByUserId, type UserRoleType } from '../repositories/userRole.repository.js'
import {
  findIdentityUsers,
  type FindIdentityUsersParams,
  type IdentityUserRole,
} from '../repositories/users.repository.js'
import { AuthError } from './auth.service.js'

export type ListUsersQuery = {
  search: string
  role: IdentityUserRole | null
  excludeCompanyId?: string | null
  page: number
  pageSize: number
}

export type ListUsersResponse = {
  items: Array<{
    id: string
    displayName: string
    email: string | null
    role?: IdentityUserRole
    avatarUrl: string | null
    phoneNumber: string | null
    isEmailVerified: boolean
    isPhoneVerified: boolean
  }>
  total: number
  page: number
  pageSize: number
}

export type IdentityUserDetail = UserProfile & {
  role?: IdentityUserRole
}

function pickRepresentativeRole(roles: UserRoleType[]): IdentityUserRole | undefined {
  const priority: IdentityUserRole[] = ['super_admin', 'company_admin', 'member']
  for (const role of priority) {
    if (roles.includes(role)) {
      return role
    }
  }
  return undefined
}

export async function listIdentityUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
  const params: FindIdentityUsersParams = {
    search: query.search,
    role: query.role,
    excludeCompanyId: query.excludeCompanyId ?? null,
    page: query.page,
    pageSize: query.pageSize,
  }

  const result = await findIdentityUsers(params)

  return {
    items: result.items.map((item) => ({
      id: item.id,
      displayName: item.display_name,
      email: item.email ?? null,
      role: item.role,
      avatarUrl: item.avatar_url,
      phoneNumber: item.phone_number ?? null,
      isEmailVerified: Boolean(item.is_email_verified),
      isPhoneVerified: Boolean(item.is_phone_verified),
    })),
    total: result.total,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getIdentityUserById(userId: string): Promise<IdentityUserDetail> {
  const user = await findUserById(userId)
  if (!user) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND')
  }

  const roleRows = await listRolesByUserId(userId)
  const role = pickRepresentativeRole(roleRows.map((row) => row.role))

  return {
    ...toUserProfile(user),
    ...(role ? { role } : {}),
  }
}
