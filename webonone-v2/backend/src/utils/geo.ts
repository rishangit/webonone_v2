const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance in kilometers (Haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function parseCoordinate(
  raw: unknown,
  min: number,
  max: number,
): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n < min || n > max) return undefined
  return n
}

export function parseLatLng(query: {
  lat?: unknown
  lng?: unknown
}): { lat: number; lng: number } | null {
  const lat = parseCoordinate(query.lat, -90, 90)
  const lng = parseCoordinate(query.lng, -180, 180)
  if (lat == null || lng == null) return null
  return { lat, lng }
}

export function toFiniteNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}
