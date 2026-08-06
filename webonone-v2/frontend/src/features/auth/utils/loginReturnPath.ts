import { parseCoreReturnPath } from '@webonone/platform-nav'

const RETURN_PATH_STORAGE_KEY = 'webonone_login_return_path'

/** Persist a same-app return path before navigating to `/login` (survives rare query loss). */
export function storeLoginReturnPath(returnPath: string): void {
  const validated = parseCoreReturnPath(returnPath)
  if (!validated || typeof sessionStorage === 'undefined') {
    return
  }
  try {
    sessionStorage.setItem(RETURN_PATH_STORAGE_KEY, validated)
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** Read stored return path without clearing (LoginPage may re-render before success). */
export function peekLoginReturnPath(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  try {
    return parseCoreReturnPath(sessionStorage.getItem(RETURN_PATH_STORAGE_KEY))
  } catch {
    return null
  }
}

export function clearLoginReturnPath(): void {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  try {
    sessionStorage.removeItem(RETURN_PATH_STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
