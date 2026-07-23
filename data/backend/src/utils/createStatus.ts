import type { DataRole, EntityStatus } from '../models/db.js'

/** Company owners always create Unverified (`pending`); super admins may choose. */
export function resolveCreateStatus(
  role: DataRole | undefined,
  requested?: EntityStatus,
): EntityStatus {
  if (role === 'company_admin') return 'pending'
  return requested ?? 'pending'
}
