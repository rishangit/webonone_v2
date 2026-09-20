import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type {
  AddCustomerParams,
  CreateCustomerParams,
  IdentityUserDetail,
  ListCustomersParams,
  ListUsersParams,
  ListUsersResponse,
  UserPickerUser,
} from '@/features/users/types/users.types'

const client = createApiClient(env.identityApiBaseUrl)

export async function getUser(userId: string): Promise<IdentityUserDetail> {
  const result = await client<{ user: IdentityUserDetail }>(`/users/${encodeURIComponent(userId)}`)
  return result.user
}

export async function listUsers(params: ListUsersParams): Promise<ListUsersResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.role) query.set('role', params.role)
  if (params.excludeCompanyId) query.set('excludeCompanyId', params.excludeCompanyId)

  return client<ListUsersResponse>(`/users?${query.toString()}`)
}

export async function listCompanyCustomers(
  params: ListCustomersParams,
): Promise<ListUsersResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))
  if (params.search?.trim()) query.set('search', params.search.trim())

  return client<ListUsersResponse>(
    `/companies/${encodeURIComponent(params.companyId)}/customers?${query.toString()}`,
  )
}

export async function addCompanyCustomer(params: AddCustomerParams): Promise<UserPickerUser> {
  return client<UserPickerUser>(`/companies/${encodeURIComponent(params.companyId)}/customers`, {
    method: 'POST',
    body: {
      userId: params.userId,
      companyName: params.companyName ?? '',
    },
  })
}

export async function createCompanyCustomer(
  params: CreateCustomerParams,
): Promise<UserPickerUser> {
  return client<UserPickerUser>(
    `/companies/${encodeURIComponent(params.companyId)}/customers/create`,
    {
      method: 'POST',
      body: {
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email ?? '',
        phoneNumber: params.phoneNumber ?? '',
        companyName: params.companyName ?? '',
      },
    },
  )
}
