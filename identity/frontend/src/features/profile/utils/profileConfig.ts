export function getIdentityProfileRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/profile`
  }

  return 'http://127.0.0.1:3011/profile'
}
