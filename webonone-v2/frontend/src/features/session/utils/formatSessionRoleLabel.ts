import type { SessionRole } from '@/features/session/types/sessionRole.types'

const SESSION_ROLE_LABELS: Record<SessionRole, string> = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  member: 'Default User',
}

export function formatSessionRoleLabel(role: SessionRole | null): string | undefined {
  if (!role) return undefined
  return SESSION_ROLE_LABELS[role]
}
