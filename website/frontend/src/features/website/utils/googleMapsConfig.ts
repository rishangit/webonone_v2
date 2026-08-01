/** Browser Maps key — never put secret Maps keys in backend env. */
export function getGoogleMapsApiKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey() !== null
}
