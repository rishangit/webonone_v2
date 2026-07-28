import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import type { UserOption, UserSelectionLoadParams, UserSelectionLoadResult } from '@webonone/ui-kit'

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

export async function loadIdentityUsersForStaff(
  accessToken: string,
  params: UserSelectionLoadParams,
  excludeUserIds: ReadonlySet<string>,
): Promise<UserSelectionLoadResult> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))
  if (params.search) query.set('search', params.search)
  if (params.role) query.set('role', params.role)

  const res = await fetch(`${getIdentityApiBase()}/users?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(data.message ?? `Failed to load users (${res.status})`)
  }

  const data = (await res.json()) as ListUsersResponse
  const users: UserOption[] = data.items
    .filter((user) => !excludeUserIds.has(user.id))
    .map((user) => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
    }))

  return {
    users,
    hasMore: data.page * data.pageSize < data.total,
  }
}
