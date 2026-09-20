import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type {
  CompanyStaffLeave,
  CreateCompanyStaffLeaveBody,
} from '@/features/staff/types/staffLeave.types'

const client = createApiClient(env.webononeApiBaseUrl)

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
    query: { page?: number; pageSize?: number; status?: string },
  ): Promise<StaffLeaveListResponse> {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('pageSize', String(query.pageSize ?? 12))
    if (query.status && query.status !== 'all') {
      params.set('status', query.status)
    }
    const qs = params.toString()
    return client<StaffLeaveListResponse>(`${staffLeavesPath(staffId)}?${qs}`)
  },

  create(staffId: string, body: CreateCompanyStaffLeaveBody): Promise<CompanyStaffLeave> {
    return client<CompanyStaffLeave>(staffLeavesPath(staffId), {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  approve(staffId: string, leaveId: string): Promise<CompanyStaffLeave> {
    return client<CompanyStaffLeave>(
      staffLeavesPath(staffId, `/${encodeURIComponent(leaveId)}/approve`),
      { method: 'POST' },
    )
  },

  reject(staffId: string, leaveId: string): Promise<CompanyStaffLeave> {
    return client<CompanyStaffLeave>(
      staffLeavesPath(staffId, `/${encodeURIComponent(leaveId)}/reject`),
      { method: 'POST' },
    )
  },

  delete(staffId: string, leaveId: string): Promise<void> {
    return client<void>(staffLeavesPath(staffId, `/${encodeURIComponent(leaveId)}`), {
      method: 'DELETE',
    })
  },
}
