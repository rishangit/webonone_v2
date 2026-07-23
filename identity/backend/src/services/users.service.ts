import {
  findIdentityUsers,
  type FindIdentityUsersParams,
  type IdentityUserRole,
} from '../repositories/users.repository.js'

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
  }>
  total: number
  page: number
  pageSize: number
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
    })),
    total: result.total,
    page: query.page,
    pageSize: query.pageSize,
  }
}
