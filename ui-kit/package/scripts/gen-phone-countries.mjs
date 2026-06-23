/**
 * One-time generator for phoneCountries.ts — run from ui-kit/package:
 *   node scripts/gen-phone-countries.mjs
 *
 * Source data: country-telephone-data (ITU E.164 reference).
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const { allCountries } = require('country-telephone-data')

function cleanName(name) {
  return name.replace(/\s*\([^)]*\)\s*/g, '').trim()
}

const rows = allCountries.map((c) => ({
  iso2: c.iso2.toUpperCase(),
  name: cleanName(c.name),
  dialCode: `+${c.dialCode}`,
}))

rows.sort((a, b) => a.name.localeCompare(b.name))

const outPath = join(__dirname, '../src/data/phoneCountries.ts')
const content = `/**
 * ISO 3166-1 alpha-2 territories with E.164 country calling codes.
 * Source: ITU-T E.164 / country-telephone-data@0.6.3 (static snapshot).
 * Each row is keyed by iso2; shared dial codes (e.g. US/CA +1) are separate rows.
 */

export interface PhoneCountry {
  iso2: string
  name: string
  dialCode: string
}

const PHONE_COUNTRIES_RAW: PhoneCountry[] = ${JSON.stringify(rows, null, 2)}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = PHONE_COUNTRIES_RAW

const byIso2 = new Map<string, PhoneCountry>()
for (const country of PHONE_COUNTRIES) {
  byIso2.set(country.iso2.toUpperCase(), country)
}

export function getPhoneCountryByIso2(iso2: string): PhoneCountry | undefined {
  return byIso2.get(iso2.toUpperCase())
}

/** Regional indicator symbols from ISO 3166-1 alpha-2 (no image assets). */
export function getFlagEmoji(iso2: string): string {
  const code = iso2.toUpperCase()
  if (code.length !== 2) return ''
  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0)),
  )
}

/** Concatenate dial code and national digits (no libphonenumber validation). */
export function formatPhoneE164(iso2: string, nationalNumber: string): string {
  const country = getPhoneCountryByIso2(iso2)
  if (!country) return nationalNumber.replace(/\\D/g, '')
  const digits = nationalNumber.replace(/\\D/g, '')
  return \`\${country.dialCode}\${digits}\`
}
`

writeFileSync(outPath, content, 'utf8')
console.log(`Wrote ${rows.length} countries to ${outPath}`)
