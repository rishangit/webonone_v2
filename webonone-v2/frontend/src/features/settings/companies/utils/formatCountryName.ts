import { getPhoneCountryByIso2 } from '@webonone/ui-kit'

/** ISO 3166-1 alpha-2 → country name; falls back to the stored value. */
export function formatCountryName(iso2: string | null | undefined): string {
  const code = iso2?.trim()
  if (!code) return ''
  return getPhoneCountryByIso2(code)?.name ?? code
}
