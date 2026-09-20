import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import { secureStorage } from '@/shared/services/secureStorage'

const identityClient = createApiClient(env.identityApiBaseUrl)

export type CustomerOption = {
  id: string
  displayName: string
  email: string | null
  avatarUrl?: string | null
}

type CustomerRow = {
  id: string
  displayName: string
  email: string | null
  avatarUrl?: string | null
  role?: string
}

type ListCustomersResponse = {
  items: CustomerRow[]
  total: number
  page: number
  pageSize: number
}

async function requireCompanyId(): Promise<string> {
  const session = await secureStorage.getSessionRole()
  if (!session?.companyId) throw new Error('Company session required')
  return session.companyId
}

export const customersApi = {
  async loadForSelection(params: { search: string; page: number; pageSize: number }) {
    const companyId = await requireCompanyId()
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    })
    if (params.search.trim()) query.set('search', params.search.trim())

    const data = await identityClient<ListCustomersResponse>(
      `/companies/${encodeURIComponent(companyId)}/customers?${query}`,
    )
    const page = data.page ?? params.page
    const pageSize = data.pageSize ?? params.pageSize
    const total = data.total ?? (data.items ?? []).length
    return {
      users: (data.items ?? []).map((item) => ({
        id: item.id,
        displayName: item.displayName,
        email: item.email,
        avatarUrl: item.avatarUrl ?? null,
        role: item.role,
      })),
      hasMore: page * pageSize < total,
    }
  },

  async create(body: {
    firstName: string
    lastName: string
    email?: string
    phoneNumber: string
  }): Promise<CustomerOption> {
    const companyId = await requireCompanyId()
    const data = await identityClient<CustomerOption & { message?: string }>(
      `/companies/${encodeURIComponent(companyId)}/customers/create`,
      {
        method: 'POST',
        body: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email ?? '',
          phoneNumber: body.phoneNumber,
        },
      },
    )
    return {
      id: data.id,
      displayName: data.displayName,
      email: data.email,
      avatarUrl: data.avatarUrl ?? null,
    }
  },
}
