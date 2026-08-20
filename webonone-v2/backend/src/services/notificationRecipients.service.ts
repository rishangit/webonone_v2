import * as roleClient from '../clients/identityRoleClient.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import * as sessionTokenRepo from '../repositories/companyEventSessionToken.repository.js'
import * as eventRepo from '../repositories/companyEvent.repository.js'

export async function resolveSuperAdminUserIds(): Promise<string[]> {
  try {
    return await roleClient.listSuperAdminUserIds()
  } catch (err) {
    console.error('[notifications] resolveSuperAdminUserIds failed:', err)
    return []
  }
}

export async function resolveCompanyAdminUserIds(companyId: string): Promise<string[]> {
  try {
    return await roleClient.listCompanyAdminUserIds(companyId)
  } catch (err) {
    console.error('[notifications] resolveCompanyAdminUserIds failed:', err)
    return []
  }
}

export async function resolveEventStaffUserId(
  companyId: string,
  staffId: string | null | undefined,
): Promise<string | null> {
  if (!staffId) return null
  try {
    const staff = await staffRepo.findStaffById(companyId, staffId)
    return staff?.user_id ?? null
  } catch (err) {
    console.error('[notifications] resolveEventStaffUserId failed:', err)
    return null
  }
}

export async function resolveSessionCustomerUserIds(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  attendeeUserId?: string | null,
): Promise<string[]> {
  try {
    const tokens = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
    const fromTokens = tokens.map((t) => t.user_id)
    if (fromTokens.length > 0) {
      return [...new Set(fromTokens)]
    }
    if (attendeeUserId) return [attendeeUserId]

    const event = await eventRepo.findEventById(companyId, eventId)
    if (event?.attendee_user_id) return [event.attendee_user_id]
    return []
  } catch (err) {
    console.error('[notifications] resolveSessionCustomerUserIds failed:', err)
    return []
  }
}
