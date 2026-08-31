import type { UserSelectionLoadParams, UserSelectionLoadResult } from '@webonone/ui-kit'
import { getAccessToken } from '@/shared/services/apiClient'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { store } from '@/app/store'

export type IdentityCustomerOption = {
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

export const identityCustomersApi = {
  async list(): Promise<IdentityCustomerOption[]> {
    const token = getAccessToken()
    const companyId = store.getState().sessionRole.activeCompanyId
    if (!token) throw new Error('Not authenticated')
    if (!companyId) throw new Error('Company session required')

    const query = new URLSearchParams({ page: '1', pageSize: '100' })
    const res = await fetch(
      `${getIdentityApiBase()}/companies/${encodeURIComponent(companyId)}/customers?${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    )
    const data = (await res.json().catch(() => ({}))) as ListCustomersResponse & {
      message?: string
    }
    if (!res.ok) {
      throw new Error(data.message ?? 'Failed to load customers')
    }
    return (data.items ?? []).map((item) => ({
      id: item.id,
      displayName: item.displayName,
      email: item.email,
      avatarUrl: item.avatarUrl ?? null,
    }))
  },

  async loadForSelection(params: UserSelectionLoadParams): Promise<UserSelectionLoadResult> {
    const token = getAccessToken()
    const companyId = store.getState().sessionRole.activeCompanyId
    if (!token) throw new Error('Not authenticated')
    if (!companyId) throw new Error('Company session required')

    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    })
    if (params.search.trim()) query.set('search', params.search.trim())

    const res = await fetch(
      `${getIdentityApiBase()}/companies/${encodeURIComponent(companyId)}/customers?${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    )
    const data = (await res.json().catch(() => ({}))) as ListCustomersResponse & {
      message?: string
    }
    if (!res.ok) {
      throw new Error(data.message ?? 'Failed to load customers')
    }
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
  }): Promise<IdentityCustomerOption> {
    const token = getAccessToken()
    const companyId = store.getState().sessionRole.activeCompanyId
    if (!token) throw new Error('Not authenticated')
    if (!companyId) throw new Error('Company session required')

    const res = await fetch(
      `${getIdentityApiBase()}/companies/${encodeURIComponent(companyId)}/customers/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email ?? '',
          phoneNumber: body.phoneNumber,
        }),
      },
    )
    const data = (await res.json().catch(() => ({}))) as IdentityCustomerOption & {
      message?: string
    }
    if (!res.ok) {
      throw new Error(data.message ?? 'Failed to create customer')
    }
    return {
      id: data.id,
      displayName: data.displayName,
      email: data.email,
      avatarUrl: data.avatarUrl ?? null,
    }
  },
}
