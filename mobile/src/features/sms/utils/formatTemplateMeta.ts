import type { SmsAdminTemplate } from '@/shared/services/smsAdminApi'

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

const DISPLAY_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DISPLAY_DATE_OPTIONS,
  hour: 'numeric',
  minute: '2-digit',
}

export function formatTemplateDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en', DISPLAY_DATETIME_OPTIONS)
}

export function formatTemplateScope(template: SmsAdminTemplate): string {
  if (template.isDefault) return 'Default'
  return template.scope === 'platform' ? 'Platform' : 'Company'
}

export function truncateTemplateBody(value: string, max = 160): string {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return '—'
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}
