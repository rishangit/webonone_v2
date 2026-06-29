export const RESET_EMAIL_STORAGE_KEY = 'identity:reset-email'

export function saveResetEmail(email: string): void {
  sessionStorage.setItem(RESET_EMAIL_STORAGE_KEY, email.trim().toLowerCase())
}

export function loadResetEmail(): string | null {
  return sessionStorage.getItem(RESET_EMAIL_STORAGE_KEY)
}

export function clearResetEmail(): void {
  sessionStorage.removeItem(RESET_EMAIL_STORAGE_KEY)
}
