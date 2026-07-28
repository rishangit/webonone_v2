import { apiClient } from '@/shared/services/apiClient'
import type {
  CompanyStaff,
  CreateCompanyStaffBody,
  UpdateCompanyStaffBody,
} from '../types/staff.types'
import type { CatalogListQuery, PaginatedResult } from '@webonone/store-kit'

type StaffListResponse = {
  items: CompanyStaff[]
  total: number
  page: number
  pageSize: number
}

export const staffApi = {
  async list(query: CatalogListQuery): Promise<PaginatedResult<CompanyStaff>> {
    const result = await apiClient<StaffListResponse>('/company/staff')
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
    const pageSize = query.pageSize ?? 20
    const start = (page - 1) * pageSize
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    }
  },

  get(id: string): Promise<CompanyStaff> {
    return apiClient<CompanyStaff>(`/company/staff/${encodeURIComponent(id)}`)
  },

  create(body: CreateCompanyStaffBody): Promise<CompanyStaff> {
    return apiClient<CompanyStaff>('/company/staff', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: UpdateCompanyStaffBody): Promise<CompanyStaff> {
    return apiClient<CompanyStaff>(`/company/staff/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string): Promise<void> {
    return apiClient<void>(`/company/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
