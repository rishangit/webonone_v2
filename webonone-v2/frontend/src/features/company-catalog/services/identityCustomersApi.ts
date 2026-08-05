import { getAccessToken } from '@/shared/services/apiClient'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { store } from '@/app/store'

export type IdentityCustomerOption = {
  id: string
  displayName: string
  email: string | null
}

type ListCustomersResponse = {
  items: Array<{
    id: string
    displayName: string
    email: string | null
  }>
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
    }))
  },
}
