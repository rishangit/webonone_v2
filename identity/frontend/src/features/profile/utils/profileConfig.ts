export const IDENTITY_PROFILE_URL =
  import.meta.env.VITE_IDENTITY_PROFILE_URL ?? 'http://localhost:3001/profile'

export function getIdentityProfileRedirectUri(): string {
  if (import.meta.env.VITE_IDENTITY_PROFILE_URL) {
    return import.meta.env.VITE_IDENTITY_PROFILE_URL
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/profile`
  }
  return 'http://localhost:3001/profile'
}
