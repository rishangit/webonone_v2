import * as leaveRepo from '../repositories/companyStaffLeave.repository.js'
import type { CompanyEventSessionRunRow } from '../repositories/companyEventSessionRun.repository.js'

export type SessionIssueKind = 'staff_leave' | 'cancelled' | null

function toYmd(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function effectiveStaffId(
  eventStaffId: string | null,
  run: Pick<CompanyEventSessionRunRow, 'staff_id'> | undefined,
): string {
  return run?.staff_id || eventStaffId || ''
}

export function isRunCancelled(
  run: Pick<CompanyEventSessionRunRow, 'cancelled_at'> | undefined,
): boolean {
  return Boolean(run?.cancelled_at)
}

export async function loadApprovedLeaveDatesByStaff(
  companyId: string,
  staffIds: string[],
  from: string,
  to: string,
): Promise<Map<string, Array<{ from: string; to: string }>>> {
  const unique = [...new Set(staffIds.filter(Boolean))]
  const rows = await leaveRepo.listApprovedLeavesForStaffIds(companyId, unique, from, to)
  const map = new Map<string, Array<{ from: string; to: string }>>()
  for (const row of rows) {
    const list = map.get(row.staff_id) ?? []
    list.push({ from: toYmd(row.start_date), to: toYmd(row.end_date) })
    map.set(row.staff_id, list)
  }
  return map
}

export function staffOnApprovedLeave(
  leaveByStaff: Map<string, Array<{ from: string; to: string }>>,
  staffId: string,
  date: string,
): boolean {
  const ranges = leaveByStaff.get(staffId) ?? []
  return ranges.some((range) => range.from <= date && range.to >= date)
}

export function resolveSessionIssue(options: {
  cancelled: boolean
  staffOnLeave: boolean
}): SessionIssueKind {
  if (options.cancelled) return 'cancelled'
  if (options.staffOnLeave) return 'staff_leave'
  return null
}
