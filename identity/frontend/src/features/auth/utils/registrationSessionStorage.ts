export const REGISTRATION_SESSION_STORAGE_KEY = 'identity:registration-session'

export function saveRegistrationSessionToken(token: string): void {
  sessionStorage.setItem(REGISTRATION_SESSION_STORAGE_KEY, token)
}

export function loadRegistrationSessionToken(): string | null {
  return sessionStorage.getItem(REGISTRATION_SESSION_STORAGE_KEY)
}

export function clearRegistrationSessionToken(): void {
  sessionStorage.removeItem(REGISTRATION_SESSION_STORAGE_KEY)
}
