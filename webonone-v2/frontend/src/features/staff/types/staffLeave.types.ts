export const LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid', 'other'] as const
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const

export type LeaveType = (typeof LEAVE_TYPES)[number]
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export type CompanyStaffLeave = {
  id: string
  companyId: string
  staffId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string | null
  status: LeaveStatus
  requestedByUserId: string
  decidedByUserId: string | null
  decidedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCompanyStaffLeaveBody = {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason?: string | null
}
