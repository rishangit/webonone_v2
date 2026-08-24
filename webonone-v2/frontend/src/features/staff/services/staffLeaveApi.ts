import { apiClient } from '@/shared/services/apiClient'
import type { CatalogListQuery, PaginatedResult } from '@webonone/store-kit'
import type {
  CompanyStaffLeave,
  CreateCompanyStaffLeaveBody,
  LeaveStatus,
} from '@/features/staff/types/staffLeave.types'

type StaffLeaveListResponse = {
  items: CompanyStaffLeave[]
  total: number
  page: number
  pageSize: number
}

function staffLeavesPath(staffId: string, suffix = ''): string {
  return `/company/staff/${encodeURIComponent(staffId)}/leaves${suffix}`
}

export const staffLeaveApi = {
  async list(
    staffId: string,
    query: CatalogListQuery,
  ): Promise<PaginatedResult<CompanyStaffLeave>> {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('pageSize', String(query.pageSize ?? 12))
    if (query.status && query.status !== 'all') {
      params.set('status', query.status)
    }
    const qs = params.toString()
    return apiClient<StaffLeaveListResponse>(`${staffLeavesPath(staffId)}?${qs}`)
  },


  create(staffId: string, body: CreateCompanyStaffLeaveBody): Promise<CompanyStaffLeave> {
    return apiClient<CompanyStaffLeave>(staffLeavesPath(staffId), {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  approve(staffId: string, leaveId: string): Promise<CompanyStaffLeave> {
    return apiClient<CompanyStaffLeave>(
      staffLeavesPath(staffId, `/${encodeURIComponent(leaveId)}/approve`),
      { method: 'POST' },
    )
  },

  reject(staffId: string, leaveId: string): Promise<CompanyStaffLeave> {
    return apiClient<CompanyStaffLeave>(
      staffLeavesPath(staffId, `/${encodeURIComponent(leaveId)}/reject`),
      { method: 'POST' },
    )
  },

  delete(staffId: string, leaveId: string): Promise<void> {
    return apiClient<void>(staffLeavesPath(staffId, `/${encodeURIComponent(leaveId)}`), {
      method: 'DELETE',
    })
  },
}

export type { LeaveStatus }
