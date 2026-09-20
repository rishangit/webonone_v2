import AsyncStorage from '@react-native-async-storage/async-storage'

const REGISTRATION_EMAIL_KEY = 'identity:registration-email'
const REGISTRATION_SESSION_KEY = 'identity:registration-session'
const RESET_EMAIL_KEY = 'identity:reset-email'
const RESET_SESSION_KEY = 'identity:reset-session-token'

export async function saveRegistrationEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(REGISTRATION_EMAIL_KEY, email.trim().toLowerCase())
}

export async function loadRegistrationEmail(): Promise<string | null> {
  return AsyncStorage.getItem(REGISTRATION_EMAIL_KEY)
}

export async function clearRegistrationEmail(): Promise<void> {
  await AsyncStorage.removeItem(REGISTRATION_EMAIL_KEY)
}

export async function saveRegistrationSessionToken(token: string): Promise<void> {
  await AsyncStorage.setItem(REGISTRATION_SESSION_KEY, token)
}

export async function loadRegistrationSessionToken(): Promise<string | null> {
  return AsyncStorage.getItem(REGISTRATION_SESSION_KEY)
}

export async function clearRegistrationSessionToken(): Promise<void> {
  await AsyncStorage.removeItem(REGISTRATION_SESSION_KEY)
}

export async function saveResetEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(RESET_EMAIL_KEY, email.trim().toLowerCase())
}

export async function loadResetEmail(): Promise<string | null> {
  return AsyncStorage.getItem(RESET_EMAIL_KEY)
}

export async function clearResetEmail(): Promise<void> {
  await AsyncStorage.removeItem(RESET_EMAIL_KEY)
}

export async function saveResetSessionToken(token: string): Promise<void> {
  await AsyncStorage.setItem(RESET_SESSION_KEY, token)
}

export async function loadResetSessionToken(): Promise<string | null> {
  return AsyncStorage.getItem(RESET_SESSION_KEY)
}

export async function clearResetSessionToken(): Promise<void> {
  await AsyncStorage.removeItem(RESET_SESSION_KEY)
}

export async function clearRegistrationWizardStorage(): Promise<void> {
  await Promise.all([clearRegistrationEmail(), clearRegistrationSessionToken()])
}
