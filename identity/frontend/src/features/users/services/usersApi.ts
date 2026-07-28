import { apiClient } from '@/shared/services/apiClient'
import type {
  AddCustomerParams,
  AddCustomerResponse,
  CreateCustomerParams,
  IdentityUserDetail,
  ListCustomersParams,
  ListUsersParams,
  ListUsersResponse,
} from '@/features/users/types'

export async function getUser(userId: string): Promise<IdentityUserDetail> {
  const result = await apiClient<{ user: IdentityUserDetail }>(
    `/users/${encodeURIComponent(userId)}`,
  )
  return result.user
}

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
  if (params.excludeCompanyId) {
    query.set('excludeCompanyId', params.excludeCompanyId)
  }

  return apiClient<ListUsersResponse>(`/users?${query.toString()}`)
}

export async function listCompanyCustomers(
  params: ListCustomersParams,
): Promise<ListUsersResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))
  if (params.search) {
    query.set('search', params.search)
  }

  return apiClient<ListUsersResponse>(
    `/companies/${encodeURIComponent(params.companyId)}/customers?${query.toString()}`,
  )
}

export async function addCompanyCustomer(
  params: AddCustomerParams,
): Promise<AddCustomerResponse> {
  return apiClient<AddCustomerResponse>(
    `/companies/${encodeURIComponent(params.companyId)}/customers`,
    {
      method: 'POST',
      body: JSON.stringify({
        userId: params.userId,
        companyName: params.companyName ?? '',
      }),
    },
  )
}

export async function createCompanyCustomer(
  params: CreateCustomerParams,
): Promise<AddCustomerResponse> {
  return apiClient<AddCustomerResponse>(
    `/companies/${encodeURIComponent(params.companyId)}/customers/create`,
    {
      method: 'POST',
      body: JSON.stringify({
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email ?? '',
        phoneNumber: params.phoneNumber,
        companyName: params.companyName ?? '',
      }),
    },
  )
}
