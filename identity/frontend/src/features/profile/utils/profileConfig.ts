export function getIdentityProfileRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/profile`
  }

  return 'http://localhost:3001/profile'
}
