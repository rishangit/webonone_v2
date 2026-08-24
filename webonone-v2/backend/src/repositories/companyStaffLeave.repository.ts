import { db } from '../models/db.js'
import type { LeaveStatus } from '../schemas/companyStaffLeaveSchemas.js'

export interface CompanyStaffLeaveRow {
  id: string
  company_id: string
  staff_id: string
  leave_type: string
  start_date: Date | string
  end_date: Date | string
  reason: string | null
  status: LeaveStatus
  requested_by_user_id: string
  decided_by_user_id: string | null
  decided_at: Date | null
  created_at: Date
  updated_at: Date
}

export async function listLeavesByStaff(
  companyId: string,
  staffId: string,
  options: {
    status?: LeaveStatus | 'all'
    page: number
    pageSize: number
  },
): Promise<{ rows: CompanyStaffLeaveRow[]; total: number }> {
  const base = db<CompanyStaffLeaveRow>('company_staff_leaves').where({
    company_id: companyId,
    staff_id: staffId,
  })

  if (options.status && options.status !== 'all') {
    base.andWhere({ status: options.status })
  }

  const countRow = await base.clone().count<{ count: number | string }[]>('* as count').first()
  const total = Number(countRow?.count ?? 0)

  const rows = await base
    .clone()
    .orderBy('start_date', 'desc')
    .orderBy('created_at', 'desc')
    .offset((options.page - 1) * options.pageSize)
    .limit(options.pageSize)

  return { rows, total }
}

export async function findLeaveById(
  companyId: string,
  staffId: string,
  leaveId: string,
): Promise<CompanyStaffLeaveRow | undefined> {
  return db<CompanyStaffLeaveRow>('company_staff_leaves')
    .where({ id: leaveId, company_id: companyId, staff_id: staffId })
    .first()
}

export async function findOverlappingLeaves(
  staffId: string,
  startDate: string,
  endDate: string,
  excludeLeaveId?: string,
): Promise<CompanyStaffLeaveRow[]> {
  const query = db<CompanyStaffLeaveRow>('company_staff_leaves')
    .where({ staff_id: staffId })
    .whereIn('status', ['pending', 'approved'])
    .where('start_date', '<=', endDate)
    .where('end_date', '>=', startDate)

  if (excludeLeaveId) {
    query.andWhereNot({ id: excludeLeaveId })
  }

  return query
}

export async function insertLeave(row: {
  id: string
  company_id: string
  staff_id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  status: LeaveStatus
  requested_by_user_id: string
  decided_by_user_id?: string | null
  decided_at?: Date | null
}): Promise<CompanyStaffLeaveRow> {
  await db('company_staff_leaves').insert({
    ...row,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const created = await db<CompanyStaffLeaveRow>('company_staff_leaves').where({ id: row.id }).first()
  if (!created) throw new Error('Failed to create leave')
  return created
}

export async function updateLeaveStatus(
  companyId: string,
  staffId: string,
  leaveId: string,
  patch: {
    status: LeaveStatus
    decided_by_user_id: string | null
    decided_at: Date | null
  },
): Promise<CompanyStaffLeaveRow | undefined> {
  const updated = await db<CompanyStaffLeaveRow>('company_staff_leaves')
    .where({ id: leaveId, company_id: companyId, staff_id: staffId })
    .update({
      status: patch.status,
      decided_by_user_id: patch.decided_by_user_id,
      decided_at: patch.decided_at,
      updated_at: db.fn.now(3),
    })
  if (!updated) return undefined
  return findLeaveById(companyId, staffId, leaveId)
}

export async function listApprovedLeavesForStaffIds(
  companyId: string,
  staffIds: string[],
  from: string,
  to: string,
): Promise<CompanyStaffLeaveRow[]> {
  if (staffIds.length === 0) return []
  return db<CompanyStaffLeaveRow>('company_staff_leaves')
    .where({ company_id: companyId, status: 'approved' })
    .whereIn('staff_id', staffIds)
    .where('start_date', '<=', to)
    .where('end_date', '>=', from)
}

export async function deleteLeave(
  companyId: string,
  staffId: string,
  leaveId: string,
): Promise<boolean> {
  const deleted = await db('company_staff_leaves')
    .where({ id: leaveId, company_id: companyId, staff_id: staffId })
    .delete()
  return deleted > 0
}
