import { nanoid } from 'nanoid'
import type { PlatformRole } from '../middleware/requireSuperAdmin.js'
import type {
  CreateCompanyStaffLeaveBody,
  LeaveStatus,
  ListCompanyStaffLeavesQuery,
} from '../schemas/companyStaffLeaveSchemas.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import * as leaveRepo from '../repositories/companyStaffLeave.repository.js'

export type CompanyStaffLeaveDto = {
  id: string
  companyId: string
  staffId: string
  leaveType: string
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

function serviceError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function toYmd(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapLeave(row: leaveRepo.CompanyStaffLeaveRow): CompanyStaffLeaveDto {
  return {
    id: row.id,
    companyId: row.company_id,
    staffId: row.staff_id,
    leaveType: row.leave_type,
    startDate: toYmd(row.start_date),
    endDate: toYmd(row.end_date),
    reason: row.reason,
    status: row.status,
    requestedByUserId: row.requested_by_user_id,
    decidedByUserId: row.decided_by_user_id,
    decidedAt: row.decided_at ? row.decided_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function requireStaffRow(companyId: string, staffId: string) {
  const row = await staffRepo.findStaffById(companyId, staffId)
  if (!row) throw serviceError('Staff not found', 404)
  return row
}

function assertCanAccessStaffLeaves(
  staffUserId: string,
  sessionUserId: string,
  sessionRole: PlatformRole,
): void {
  if (sessionRole === 'company_admin') return
  if (staffUserId !== sessionUserId) {
    throw serviceError('You can only view leaves for your own staff record', 403)
  }
}

function assertCanCreateLeave(
  staffUserId: string,
  sessionUserId: string,
  sessionRole: PlatformRole,
): void {
  if (sessionRole === 'company_admin') return
  if (staffUserId !== sessionUserId) {
    throw serviceError('You can only request leave for your own staff record', 403)
  }
}

async function assertNoOverlap(
  staffId: string,
  startDate: string,
  endDate: string,
  excludeLeaveId?: string,
): Promise<void> {
  const overlapping = await leaveRepo.findOverlappingLeaves(
    staffId,
    startDate,
    endDate,
    excludeLeaveId,
  )
  if (overlapping.length > 0) {
    throw serviceError('Leave dates overlap an existing pending or approved leave', 409)
  }
}

export async function listCompanyStaffLeaves(
  companyId: string,
  staffId: string,
  sessionUserId: string,
  sessionRole: PlatformRole,
  query: ListCompanyStaffLeavesQuery,
): Promise<{
  items: CompanyStaffLeaveDto[]
  total: number
  page: number
  pageSize: number
}> {
  const staff = await requireStaffRow(companyId, staffId)
  assertCanAccessStaffLeaves(staff.user_id, sessionUserId, sessionRole)

  const { rows, total } = await leaveRepo.listLeavesByStaff(companyId, staffId, {
    status: query.status,
    page: query.page,
    pageSize: query.pageSize,
  })

  return {
    items: rows.map(mapLeave),
    total,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function createCompanyStaffLeave(
  companyId: string,
  staffId: string,
  sessionUserId: string,
  sessionRole: PlatformRole,
  body: CreateCompanyStaffLeaveBody,
): Promise<CompanyStaffLeaveDto> {
  const staff = await requireStaffRow(companyId, staffId)
  assertCanCreateLeave(staff.user_id, sessionUserId, sessionRole)
  await assertNoOverlap(staffId, body.start_date, body.end_date)

  const isOwner = sessionRole === 'company_admin'
  const status: LeaveStatus = isOwner ? 'approved' : 'pending'
  const now = isOwner ? new Date() : null

  const row = await leaveRepo.insertLeave({
    id: nanoid(),
    company_id: companyId,
    staff_id: staffId,
    leave_type: body.leave_type,
    start_date: body.start_date,
    end_date: body.end_date,
    reason: body.reason?.trim() || null,
    status,
    requested_by_user_id: sessionUserId,
    decided_by_user_id: isOwner ? sessionUserId : null,
    decided_at: now,
  })

  return mapLeave(row)
}

export async function approveCompanyStaffLeave(
  companyId: string,
  staffId: string,
  leaveId: string,
  decidedByUserId: string,
): Promise<CompanyStaffLeaveDto> {
  await requireStaffRow(companyId, staffId)
  const existing = await leaveRepo.findLeaveById(companyId, staffId, leaveId)
  if (!existing) throw serviceError('Leave not found', 404)
  if (existing.status !== 'pending') {
    throw serviceError('Only pending leave can be approved', 409)
  }

  const updated = await leaveRepo.updateLeaveStatus(companyId, staffId, leaveId, {
    status: 'approved',
    decided_by_user_id: decidedByUserId,
    decided_at: new Date(),
  })
  if (!updated) throw serviceError('Leave not found', 404)
  return mapLeave(updated)
}

export async function rejectCompanyStaffLeave(
  companyId: string,
  staffId: string,
  leaveId: string,
  decidedByUserId: string,
): Promise<CompanyStaffLeaveDto> {
  await requireStaffRow(companyId, staffId)
  const existing = await leaveRepo.findLeaveById(companyId, staffId, leaveId)
  if (!existing) throw serviceError('Leave not found', 404)
  if (existing.status !== 'pending') {
    throw serviceError('Only pending leave can be rejected', 409)
  }

  const updated = await leaveRepo.updateLeaveStatus(companyId, staffId, leaveId, {
    status: 'rejected',
    decided_by_user_id: decidedByUserId,
    decided_at: new Date(),
  })
  if (!updated) throw serviceError('Leave not found', 404)
  return mapLeave(updated)
}

export async function deleteCompanyStaffLeave(
  companyId: string,
  staffId: string,
  leaveId: string,
  sessionUserId: string,
  sessionRole: PlatformRole,
): Promise<void> {
  await requireStaffRow(companyId, staffId)
  const existing = await leaveRepo.findLeaveById(companyId, staffId, leaveId)
  if (!existing) throw serviceError('Leave not found', 404)
  if (existing.status !== 'pending') {
    throw serviceError('Only pending leave can be cancelled', 409)
  }

  const isOwner = sessionRole === 'company_admin'
  const isRequester = existing.requested_by_user_id === sessionUserId
  if (!isOwner && !isRequester) {
    throw serviceError('You can only cancel your own pending leave requests', 403)
  }

  const deleted = await leaveRepo.deleteLeave(companyId, staffId, leaveId)
  if (!deleted) throw serviceError('Leave not found', 404)
}
