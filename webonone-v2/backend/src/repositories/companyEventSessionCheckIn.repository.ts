import { db } from '../models/db.js'

export type SessionCheckInRow = {
  id: string
  company_id: string
  event_id: string
  occurrence_date: string | Date
  user_id: string
  user_display_name: string
  user_email: string | null
  user_avatar_url: string | null
  checked_in_at: Date | string
}

export async function listCheckInsForSession(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionCheckInRow[]> {
  return db<SessionCheckInRow>('company_event_session_check_ins')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
    })
    .orderBy('checked_in_at', 'asc')
}

export async function findCheckInByUser(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  userId: string,
): Promise<SessionCheckInRow | undefined> {
  return db<SessionCheckInRow>('company_event_session_check_ins')
    .where({
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      user_id: userId,
    })
    .first()
}

export async function listCheckInsForUserEventsInRange(
  userId: string,
  eventIds: string[],
  from: string,
  to: string,
): Promise<SessionCheckInRow[]> {
  if (eventIds.length === 0) return []
  return db<SessionCheckInRow>('company_event_session_check_ins')
    .where({ user_id: userId })
    .whereIn('event_id', eventIds)
    .whereBetween('occurrence_date', [from, to])
}

export async function insertCheckIn(input: {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  userAvatarUrl?: string | null
}): Promise<SessionCheckInRow> {
  await db('company_event_session_check_ins').insert({
    id: input.id,
    company_id: input.companyId,
    event_id: input.eventId,
    occurrence_date: input.occurrenceDate,
    user_id: input.userId,
    user_display_name: input.userDisplayName,
    user_email: input.userEmail,
    user_avatar_url: input.userAvatarUrl ?? null,
  })
  const row = await findCheckInByUser(
    input.companyId,
    input.eventId,
    input.occurrenceDate,
    input.userId,
  )
  if (!row) {
    throw new Error('Failed to load session check-in after insert')
  }
  return row
}
