/** Matches @webonone/i18n DISPLAY_DATE_OPTIONS — duplicated to avoid a ui-kit → i18n dependency. */
export const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

export const DISPLAY_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DISPLAY_DATE_OPTIONS,
  hour: 'numeric',
  minute: '2-digit',
}

export function formatPickerDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, DISPLAY_DATE_OPTIONS)
}

export function formatPickerDateTime(date: Date, locale = 'en-US'): string {
  return date.toLocaleString(locale, DISPLAY_DATETIME_OPTIONS)
}
