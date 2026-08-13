/**
 * Normalize a phone number for Text.lk API (digits only, Sri Lanka-friendly).
 * Examples: +94771234567 → 94771234567, 0771234567 → 94771234567
 */
export function normalizeRecipientForTextLk(input: string): string {
  let digits = input.replace(/[^\d]/g, '')
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `94${digits.slice(1)}`
  }
  return digits
}
