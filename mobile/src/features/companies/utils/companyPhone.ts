import { PHONE_COUNTRIES, formatPhoneE164, getPhoneCountryByIso2 } from '@webonone/mobile-ui'

export { formatPhoneE164 }

export function parsePhoneE164(
  e164: string | null | undefined,
  options?: { fallbackIso2?: string },
): { iso2: string; nationalNumber: string } {
  const fallbackIso2 = options?.fallbackIso2 ?? 'LK'
  const raw = (e164 ?? '').trim()
  if (!raw) {
    return { iso2: fallbackIso2, nationalNumber: '' }
  }

  const normalized = raw.startsWith('+') ? raw : `+${raw.replace(/\D/g, '')}`
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)

  for (const country of sorted) {
    if (normalized.startsWith(country.dial)) {
      return {
        iso2: country.iso2,
        nationalNumber: normalized.slice(country.dial.length).replace(/\D/g, ''),
      }
    }
  }

  return { iso2: fallbackIso2, nationalNumber: normalized.replace(/\D/g, '') }
}

export function contactPhoneFromValues(phoneCountry: string, phoneNational: string): string {
  return formatPhoneE164(phoneCountry, phoneNational) || phoneNational.trim()
}

export function defaultPhoneCountry(): string {
  return getPhoneCountryByIso2('LK').iso2
}
