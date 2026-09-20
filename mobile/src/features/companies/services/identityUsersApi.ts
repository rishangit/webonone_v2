import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { UserOption } from '@webonone/mobile-ui'

type IdentityUserRow = {
  id: string
  displayName: string
  email: string | null
  role?: string
  avatarUrl?: string | null
}

type ListUsersResponse = {
  items: IdentityUserRow[]
  total: number
  page: number
  pageSize: number
}

const client = createApiClient(env.identityApiBaseUrl)

export async function loadIdentityUsers(params: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ users: UserOption[]; hasMore: boolean }> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 1))
  search.set('pageSize', String(params.pageSize ?? 50))
  if (params.search?.trim()) search.set('search', params.search.trim())

  const data = await client<ListUsersResponse>(`/users?${search.toString()}`)
  const users: UserOption[] = data.items.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    email: user.email ?? '',
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
  }))

  return {
    users,
    hasMore: data.page * data.pageSize < data.total,
  }
}
