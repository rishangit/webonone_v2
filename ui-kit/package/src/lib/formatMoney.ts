export type FormatMoneyOptions = {
  currency?: string
  /** When true, `value` is in minor units (e.g. cents) and is divided by 100 before display. */
  minorUnits?: boolean
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /** When true, omit the currency code prefix (amount only). */
  amountOnly?: boolean
  /** Placeholder when value is null/undefined/non-finite. */
  empty?: string
}

function resolveFractionDigits(options?: FormatMoneyOptions): {
  minimumFractionDigits: number
  maximumFractionDigits: number
} {
  if (
    options?.minimumFractionDigits != null ||
    options?.maximumFractionDigits != null
  ) {
    return {
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }
  }
  return {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }
}

/**
 * Formats a monetary amount for display (default: `LKR 1,234.56`).
 */
export function formatMoney(
  value: number | null | undefined,
  options?: FormatMoneyOptions,
): string {
  const empty = options?.empty ?? '—'
  if (value == null || !Number.isFinite(value)) {
    return empty
  }

  const major = options?.minorUnits ? value / 100 : value
  const { minimumFractionDigits, maximumFractionDigits } = resolveFractionDigits(options)
  const formatted = major.toLocaleString(options?.locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  })

  if (options?.amountOnly) {
    return formatted
  }

  const currency = options?.currency ?? 'LKR'
  return `${currency} ${formatted}`
}

/** Alias for LKR amounts in major units (same shape as legacy service helpers). */
export function formatLkr(
  value: number | null | undefined,
  currency = 'LKR',
  options?: Omit<FormatMoneyOptions, 'currency'>,
): string {
  return formatMoney(value, { ...options, currency })
}
