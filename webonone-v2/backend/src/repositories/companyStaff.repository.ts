import { db } from '../models/db.js'

export interface CompanyStaffRow {
  id: string
  company_id: string
  user_id: string
  display_name: string
  email: string | null
  created_at: Date
  updated_at: Date
}

export interface CompanyStaffScheduleRow {
  id: string
  staff_id: string
  day_of_week: number
  is_working: boolean | number
  start_time: string | null
  end_time: string | null
  created_at: Date
  updated_at: Date
}

export async function listStaffByCompany(companyId: string): Promise<CompanyStaffRow[]> {
  return db<CompanyStaffRow>('company_staff')
    .where({ company_id: companyId })
    .orderBy('display_name', 'asc')
}

export async function findStaffById(
  companyId: string,
  staffId: string,
): Promise<CompanyStaffRow | undefined> {
  return db<CompanyStaffRow>('company_staff').where({ id: staffId, company_id: companyId }).first()
}

export async function findStaffByUserId(
  companyId: string,
  userId: string,
): Promise<CompanyStaffRow | undefined> {
  return db<CompanyStaffRow>('company_staff')
    .where({ company_id: companyId, user_id: userId })
    .first()
}

export async function insertStaff(row: {
  id: string
  company_id: string
  user_id: string
  display_name: string
  email: string | null
}): Promise<CompanyStaffRow> {
  await db('company_staff').insert({
    ...row,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const created = await db<CompanyStaffRow>('company_staff').where({ id: row.id }).first()
  if (!created) throw new Error('Failed to create staff')
  return created
}

export async function updateStaff(
  companyId: string,
  staffId: string,
  patch: { user_id?: string; display_name?: string; email?: string | null },
): Promise<CompanyStaffRow | undefined> {
  await db('company_staff')
    .where({ id: staffId, company_id: companyId })
    .update({ ...patch, updated_at: db.fn.now(3) })
  return findStaffById(companyId, staffId)
}

export async function deleteStaff(companyId: string, staffId: string): Promise<number> {
  return db('company_staff').where({ id: staffId, company_id: companyId }).delete()
}

export async function listSchedulesByStaffIds(
  staffIds: string[],
): Promise<CompanyStaffScheduleRow[]> {
  if (staffIds.length === 0) return []
  return db<CompanyStaffScheduleRow>('company_staff_schedules')
    .whereIn('staff_id', staffIds)
    .orderBy(['staff_id', 'day_of_week'])
}

export async function replaceSchedules(
  staffId: string,
  days: Array<{
    id: string
    day_of_week: number
    is_working: boolean
    start_time: string | null
    end_time: string | null
  }>,
): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_staff_schedules').where({ staff_id: staffId }).delete()
    if (days.length === 0) return
    await trx('company_staff_schedules').insert(
      days.map((day) => ({
        id: day.id,
        staff_id: staffId,
        day_of_week: day.day_of_week,
        is_working: day.is_working,
        start_time: day.is_working ? day.start_time : null,
        end_time: day.is_working ? day.end_time : null,
        created_at: trx.fn.now(3),
        updated_at: trx.fn.now(3),
      })),
    )
  })
}
