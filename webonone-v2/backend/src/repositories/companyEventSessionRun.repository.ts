import { db } from '../models/db.js'

export type SessionRunStatus = 'scheduled' | 'started' | 'ended'

export interface CompanyEventSessionRunRow {
  id: string
  company_id: string
  event_id: string
  occurrence_date: string | Date
  status: SessionRunStatus
  current_token_id: string | null
  started_at: Date | null
  started_by_user_id: string | null
  ended_at: Date | null
  /** Occurrence override; null means use parent event times. */
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  created_at: Date
  updated_at: Date
}

export async function findRunForSession(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<CompanyEventSessionRunRow | undefined> {
  return db<CompanyEventSessionRunRow>('company_event_session_runs')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
    })
    .first()
}

/** Batch load runs for occurrence lists (dashboard / calendar range). */
export async function listRunsForEventsInRange(
  eventIds: string[],
  from: string,
  to: string,
): Promise<CompanyEventSessionRunRow[]> {
  if (eventIds.length === 0) return []
  return db<CompanyEventSessionRunRow>('company_event_session_runs')
    .whereIn('event_id', eventIds)
    .whereBetween('occurrence_date', [from, to])
}

export async function insertRun(row: {
  id: string
  company_id: string
  event_id: string
  occurrence_date: string
  status?: SessionRunStatus
}): Promise<CompanyEventSessionRunRow> {
  await db('company_event_session_runs').insert({
    id: row.id,
    company_id: row.company_id,
    event_id: row.event_id,
    occurrence_date: row.occurrence_date,
    status: row.status ?? 'scheduled',
    current_token_id: null,
    started_at: null,
    started_by_user_id: null,
    ended_at: null,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const created = await db<CompanyEventSessionRunRow>('company_event_session_runs')
    .where({ id: row.id })
    .first()
  if (!created) throw new Error('Failed to create session run')
  return created
}

export async function updateRun(
  id: string,
  patch: {
    status?: SessionRunStatus
    current_token_id?: string | null
    started_at?: Date | null
    started_by_user_id?: string | null
    ended_at?: Date | null
    scheduled_start_time?: string | null
    scheduled_end_time?: string | null
  },
): Promise<CompanyEventSessionRunRow> {
  await db('company_event_session_runs')
    .where({ id })
    .update({
      ...patch,
      updated_at: db.fn.now(3),
    })
  const updated = await db<CompanyEventSessionRunRow>('company_event_session_runs')
    .where({ id })
    .first()
  if (!updated) throw new Error('Failed to update session run')
  return updated
}
