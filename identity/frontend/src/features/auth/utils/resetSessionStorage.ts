export const RESET_SESSION_STORAGE_KEY = 'identity:reset-session-token'

export function saveResetSessionToken(token: string): void {
  sessionStorage.setItem(RESET_SESSION_STORAGE_KEY, token)
}

export function loadResetSessionToken(): string | null {
  return sessionStorage.getItem(RESET_SESSION_STORAGE_KEY)
}

export function clearResetSessionToken(): void {
  sessionStorage.removeItem(RESET_SESSION_STORAGE_KEY)
}
