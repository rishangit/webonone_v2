import { getPhoneCountryByIso2 } from '../data/phoneCountries'

/** Resolve ISO 3166-1 alpha-2 from browser locale tags (not geolocation). */
export function getBrowserDefaultCountryIso2(fallback = 'US'): string {
  if (typeof navigator === 'undefined') {
    return getPhoneCountryByIso2(fallback) ? fallback : 'US'
  }

  const tags = navigator.languages?.length ? [...navigator.languages] : [navigator.language]

  for (const tag of tags) {
    if (!tag) continue
    try {
      const region = new Intl.Locale(tag).region
      if (region && getPhoneCountryByIso2(region)) {
        return region.toUpperCase()
      }
    } catch {
      // Invalid BCP 47 tag — try next
    }
  }

  const resolved = getPhoneCountryByIso2(fallback) ? fallback : 'US'
  return resolved
}
