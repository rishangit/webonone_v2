import { db } from '../models/db.js'

export type SessionTokenStatus = 'waiting' | 'serving' | 'completed'

export interface CompanyEventSessionTokenRow {
  id: string
  company_id: string
  event_id: string
  occurrence_date: string | Date
  token_number: number
  status: SessionTokenStatus
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

export async function findTokenById(
  companyId: string,
  tokenId: string,
): Promise<CompanyEventSessionTokenRow | undefined> {
  return db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({
      id: tokenId,
      company_id: companyId,
    })
    .first()
}

export async function findFirstWaitingToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<CompanyEventSessionTokenRow | undefined> {
  return db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      status: 'waiting',
    })
    .orderBy('token_number', 'asc')
    .first()
}

export async function findServingToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<CompanyEventSessionTokenRow | undefined> {
  return db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      status: 'serving',
    })
    .orderBy('token_number', 'asc')
    .first()
}

export async function findLastCompletedToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<CompanyEventSessionTokenRow | undefined> {
  return db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      status: 'completed',
    })
    .orderBy('token_number', 'desc')
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
  status?: SessionTokenStatus
}): Promise<CompanyEventSessionTokenRow> {
  await db('company_event_session_tokens').insert({
    ...row,
    status: row.status ?? 'waiting',
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const created = await db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({ id: row.id })
    .first()
  if (!created) throw new Error('Failed to create session token')
  return created
}

export async function updateTokenStatus(
  id: string,
  status: SessionTokenStatus,
): Promise<CompanyEventSessionTokenRow> {
  await db('company_event_session_tokens').where({ id }).update({
    status,
    updated_at: db.fn.now(3),
  })
  const updated = await db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({ id })
    .first()
  if (!updated) throw new Error('Failed to update session token')
  return updated
}

export async function clearServingTokens(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<void> {
  await db('company_event_session_tokens')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      status: 'serving',
    })
    .update({
      status: 'waiting',
      updated_at: db.fn.now(3),
    })
}
