export function getIdentityApiBase(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_IDENTITY_API_BASE_URL ??
    'http://127.0.0.1:4011/api/v1'
  )
}
