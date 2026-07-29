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

/** Idempotent: adds Identity user as company member if not already a member. */
export async function ensureCompanyCustomer(
  accessToken: string,
  companyId: string,
  userId: string,
  companyName = '',
): Promise<void> {
  const res = await fetch(
    `${getIdentityApiBase()}/companies/${encodeURIComponent(companyId)}/customers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, companyName }),
    },
  )
  if (res.ok) return

  const data = (await res.json().catch(() => ({}))) as {
    message?: string
    code?: string
  }
  // Owners are already linked to the company; Identity rejects them as customers.
  if (res.status === 409 && data.code === 'ALREADY_OWNER') return

  throw new Error(data.message ?? `Failed to add company user (${res.status})`)
}
