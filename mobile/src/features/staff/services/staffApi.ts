import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type {
  CompanyStaff,
  CreateCompanyStaffBody,
  UpdateCompanyStaffBody,
} from '@/features/staff/types/staff.types'

const client = createApiClient(env.webononeApiBaseUrl)

type StaffListResponse = {
  items: CompanyStaff[]
  total: number
  page: number
  pageSize: number
}

export type StaffListQuery = {
  page?: number
  pageSize?: number
  q?: string
}

export const staffApi = {
  async list(query: StaffListQuery): Promise<{
    items: CompanyStaff[]
    total: number
    page: number
    pageSize: number
  }> {
    const result = await client<StaffListResponse>('/company/staff')
    const q = (query.q ?? '').trim().toLowerCase()
    let items = result.items
    if (q) {
      items = items.filter(
        (item) =>
          item.displayName.toLowerCase().includes(q) ||
          (item.email?.toLowerCase().includes(q) ?? false),
      )
    }
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 12
    const start = (page - 1) * pageSize
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    }
  },

  get(id: string): Promise<CompanyStaff> {
    return client<CompanyStaff>(`/company/staff/${encodeURIComponent(id)}`)
  },

  create(body: CreateCompanyStaffBody): Promise<CompanyStaff> {
    return client<CompanyStaff>('/company/staff', {
      method: 'POST',
      body,
    })
  },

  update(id: string, body: UpdateCompanyStaffBody): Promise<CompanyStaff> {
    return client<CompanyStaff>(`/company/staff/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
    })
  },

  delete(id: string): Promise<void> {
    return client<void>(`/company/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
