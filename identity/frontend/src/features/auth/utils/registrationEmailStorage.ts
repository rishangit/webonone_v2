export const REGISTRATION_EMAIL_STORAGE_KEY = 'identity:registration-email'

export function saveRegistrationEmail(email: string): void {
  sessionStorage.setItem(REGISTRATION_EMAIL_STORAGE_KEY, email.trim().toLowerCase())
}

export function loadRegistrationEmail(): string | null {
  return sessionStorage.getItem(REGISTRATION_EMAIL_STORAGE_KEY)
}

export function clearRegistrationEmail(): void {
  sessionStorage.removeItem(REGISTRATION_EMAIL_STORAGE_KEY)
}
