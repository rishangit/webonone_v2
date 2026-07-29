import { nanoid } from 'nanoid'
import type {
  CreateCompanyStaffBody,
  StaffScheduleDay,
  UpdateCompanyStaffBody,
} from '../schemas/companyStaffSchemas.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import * as repo from '../repositories/companyStaff.repository.js'

export async function ensureCompanyMemberRole(userId: string, companyId: string): Promise<void> {
  await roleRepo.ensureCompanyMemberRole(userId, companyId, nanoid())
}

export type StaffScheduleDayDto = {
  day_of_week: number
  is_working: boolean
  start_time: string | null
  end_time: string | null
}

export type CompanyStaffDto = {
  id: string
  companyId: string
  userId: string
  displayName: string
  email: string | null
  schedule: StaffScheduleDayDto[]
  createdAt: string
  updatedAt: string
}

function serviceError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

/** MySQL TIME may come back as HH:mm:ss — normalize to HH:mm for API/clients. */
function normalizeTime(value: string | null): string | null {
  if (!value) return null
  const match = /^(\d{2}:\d{2})/.exec(value)
  return match?.[1] ?? value
}

function mapScheduleRow(row: repo.CompanyStaffScheduleRow): StaffScheduleDayDto {
  return {
    day_of_week: Number(row.day_of_week),
    is_working: Boolean(row.is_working),
    start_time: normalizeTime(row.start_time),
    end_time: normalizeTime(row.end_time),
  }
}

function emptyWeekSchedule(): StaffScheduleDayDto[] {
  return Array.from({ length: 7 }, (_, day_of_week) => ({
    day_of_week,
    is_working: false,
    start_time: null,
    end_time: null,
  }))
}

function mapStaff(
  row: repo.CompanyStaffRow,
  scheduleRows: repo.CompanyStaffScheduleRow[],
): CompanyStaffDto {
  const byDay = new Map(scheduleRows.map((s) => [Number(s.day_of_week), mapScheduleRow(s)]))
  const schedule = emptyWeekSchedule().map((day) => byDay.get(day.day_of_week) ?? day)
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    schedule,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function hydrateStaff(rows: repo.CompanyStaffRow[]): Promise<CompanyStaffDto[]> {
  const schedules = await repo.listSchedulesByStaffIds(rows.map((r) => r.id))
  const byStaff = new Map<string, repo.CompanyStaffScheduleRow[]>()
  for (const s of schedules) {
    const list = byStaff.get(s.staff_id) ?? []
    list.push(s)
    byStaff.set(s.staff_id, list)
  }
  return rows.map((row) => mapStaff(row, byStaff.get(row.id) ?? []))
}

export async function listCompanyStaff(companyId: string): Promise<{
  items: CompanyStaffDto[]
  total: number
  page: number
  pageSize: number
}> {
  const rows = await repo.listStaffByCompany(companyId)
  const items = await hydrateStaff(rows)
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length || 20,
  }
}

export async function getCompanyStaff(companyId: string, staffId: string): Promise<CompanyStaffDto> {
  const row = await repo.findStaffById(companyId, staffId)
  if (!row) throw serviceError('Staff not found', 404)
  const [item] = await hydrateStaff([row])
  return item!
}

export async function createCompanyStaff(
  companyId: string,
  body: CreateCompanyStaffBody,
): Promise<CompanyStaffDto> {
  const existing = await repo.findStaffByUserId(companyId, body.user_id)
  if (existing) throw serviceError('This user is already on the staff list', 409)

  const id = nanoid()
  await repo.insertStaff({
    id,
    company_id: companyId,
    user_id: body.user_id,
    display_name: body.display_name.trim(),
    email: body.email?.trim() || null,
  })
  await repo.replaceSchedules(
    id,
    body.schedule.map((day) => ({
      id: nanoid(),
      day_of_week: day.day_of_week,
      is_working: day.is_working,
      start_time: day.start_time,
      end_time: day.end_time,
    })),
  )
  await ensureCompanyMemberRole(body.user_id, companyId)
  return getCompanyStaff(companyId, id)
}

export async function updateCompanyStaff(
  companyId: string,
  staffId: string,
  body: UpdateCompanyStaffBody,
): Promise<CompanyStaffDto> {
  const row = await repo.findStaffById(companyId, staffId)
  if (!row) throw serviceError('Staff not found', 404)

  if (body.user_id !== undefined && body.user_id !== row.user_id) {
    const conflict = await repo.findStaffByUserId(companyId, body.user_id)
    if (conflict && conflict.id !== staffId) {
      throw serviceError('This user is already on the staff list', 409)
    }
  }

  const previousUserId = row.user_id
  const nextUserId = body.user_id !== undefined ? body.user_id : previousUserId

  if (
    body.user_id !== undefined ||
    body.display_name !== undefined ||
    body.email !== undefined
  ) {
    await repo.updateStaff(companyId, staffId, {
      ...(body.user_id !== undefined ? { user_id: body.user_id } : {}),
      ...(body.display_name !== undefined ? { display_name: body.display_name.trim() } : {}),
      ...(body.email !== undefined ? { email: body.email?.trim() || null } : {}),
    })
  }

  if (body.schedule) {
    await repo.replaceSchedules(
      staffId,
      body.schedule.map((day: StaffScheduleDay) => ({
        id: nanoid(),
        day_of_week: day.day_of_week,
        is_working: day.is_working,
        start_time: day.start_time,
        end_time: day.end_time,
      })),
    )
  }

  if (nextUserId !== previousUserId) {
    await ensureCompanyMemberRole(nextUserId, companyId)
  }

  return getCompanyStaff(companyId, staffId)
}

export async function backfillStaffMemberRoles(): Promise<{
  total: number
  ensured: number
  failed: number
}> {
  const rows = await repo.listAllStaff()
  let ensured = 0
  let failed = 0
  for (const row of rows) {
    try {
      await ensureCompanyMemberRole(row.user_id, row.company_id)
      ensured += 1
    } catch (err) {
      failed += 1
      console.error(
        `Failed to ensure member role for staff ${row.id} (user=${row.user_id}, company=${row.company_id})`,
        err,
      )
    }
  }
  return { total: rows.length, ensured, failed }
}

export async function deleteCompanyStaff(companyId: string, staffId: string): Promise<void> {
  const deleted = await repo.deleteStaff(companyId, staffId)
  if (!deleted) throw serviceError('Staff not found', 404)
}
