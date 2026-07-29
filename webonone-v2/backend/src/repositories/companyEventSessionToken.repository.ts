import { db } from '../models/db.js'

export interface CompanyEventSessionTokenRow {
  id: string
  company_id: string
  event_id: string
  occurrence_date: string | Date
  token_number: number
  user_id: string
  user_display_name: string
  user_email: string | null
  created_at: Date
  updated_at: Date
}

export async function listTokensForSession(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<CompanyEventSessionTokenRow[]> {
  return db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
    })
    .orderBy('token_number', 'asc')
}

export async function getMaxTokenNumber(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<number> {
  const row = await db('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
    })
    .max<{ maxNumber: number | null }>('token_number as maxNumber')
    .first()
  return Number(row?.maxNumber ?? 0)
}

export async function findTokenByUser(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  userId: string,
): Promise<CompanyEventSessionTokenRow | undefined> {
  return db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      user_id: userId,
    })
    .first()
}

export async function insertToken(row: {
  id: string
  company_id: string
  event_id: string
  occurrence_date: string
  token_number: number
  user_id: string
  user_display_name: string
  user_email: string | null
}): Promise<CompanyEventSessionTokenRow> {
  await db('company_event_session_tokens').insert({
    ...row,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const created = await db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({ id: row.id })
    .first()
  if (!created) throw new Error('Failed to create session token')
  return created
}
