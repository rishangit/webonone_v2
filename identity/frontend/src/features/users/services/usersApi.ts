import { apiClient } from '@/shared/services/apiClient'
import type { ListUsersParams, ListUsersResponse } from '@/features/users/types'

export async function listUsers(params: ListUsersParams): Promise<ListUsersResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))
  if (params.search) {
    query.set('search', params.search)
  }
  if (params.role) {
    query.set('role', params.role)
  }

  return apiClient<ListUsersResponse>(`/users?${query.toString()}`)
}
