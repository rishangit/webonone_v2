import { addCompanyCustomer, listUsers } from '@/features/users/services/usersApi'
import type { UserOption } from '@webonone/mobile-ui'

export async function loadIdentityUsers(params: {
  search?: string
  page?: number
  pageSize?: number
  excludeUserIds?: ReadonlySet<string>
}): Promise<{ users: UserOption[]; hasMore: boolean }> {
  const result = await listUsers({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    search: params.search,
    role: null,
  })
  const excluded = params.excludeUserIds ?? new Set<string>()
  const users: UserOption[] = result.items
    .filter((user) => !excluded.has(user.id))
    .map((user) => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email ?? '',
      role: user.role,
      avatarUrl: user.avatarUrl,
    }))
  return {
    users,
    hasMore: result.page * result.pageSize < result.total,
  }
}

export async function ensureCompanyCustomer(companyId: string, userId: string): Promise<void> {
  try {
    await addCompanyCustomer({ companyId, userId, companyName: '' })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.toLowerCase().includes('already') || message.toLowerCase().includes('owner')) {
      return
    }
    throw err
  }
}
