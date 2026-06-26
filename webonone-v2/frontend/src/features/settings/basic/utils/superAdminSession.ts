const SUPER_ADMIN_TOKEN_KEY = 'webonone:super-admin-token'
const SUPER_ADMIN_NAME_KEY = 'webonone:super-admin-name'

export function getSuperAdminToken(): string | null {
  return sessionStorage.getItem(SUPER_ADMIN_TOKEN_KEY)
}

export function getSuperAdminDisplayName(): string | null {
  return sessionStorage.getItem(SUPER_ADMIN_NAME_KEY)
}

export function setSuperAdminSession(accessToken: string, displayName: string): void {
  sessionStorage.setItem(SUPER_ADMIN_TOKEN_KEY, accessToken)
  sessionStorage.setItem(SUPER_ADMIN_NAME_KEY, displayName)
}

export function clearSuperAdminSession(): void {
  sessionStorage.removeItem(SUPER_ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(SUPER_ADMIN_NAME_KEY)
}
