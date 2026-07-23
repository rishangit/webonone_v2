import type { SessionRole } from '../types/sessionRole.types'

export const WEBONONE_SESSION_ROLE_STORAGE_KEY = 'webonone_session_role'

export type StoredSessionRole = {
  selectionComplete: boolean
  activeRole: SessionRole
  activeCompanyId: string | null
  userId?: string
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined'
}

export function readSessionRoleStorage(): StoredSessionRole | null {
  if (!canUseStorage()) {
    return null
  }

  try {
    const raw = localStorage.getItem(WEBONONE_SESSION_ROLE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredSessionRole>
    if (
      !parsed.selectionComplete ||
      (parsed.activeRole !== 'member' &&
        parsed.activeRole !== 'super_admin' &&
        parsed.activeRole !== 'company_admin')
    ) {
      return null
    }

    return {
      selectionComplete: true,
      activeRole: parsed.activeRole,
      activeCompanyId: parsed.activeCompanyId ?? null,
      userId: parsed.userId,
    }
  } catch {
    return null
  }
}

export function writeSessionRoleStorage(session: StoredSessionRole): void {
  if (!canUseStorage()) {
    return
  }

  try {
    localStorage.setItem(WEBONONE_SESSION_ROLE_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors
  }
}

export function clearSessionRoleStorage(): void {
  if (!canUseStorage()) {
    return
  }

  try {
    localStorage.removeItem(WEBONONE_SESSION_ROLE_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}
