export function getIdentityApiBase(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_IDENTITY_API_BASE_URL ??
    'http://localhost:4011/api/v1'
  )
}
