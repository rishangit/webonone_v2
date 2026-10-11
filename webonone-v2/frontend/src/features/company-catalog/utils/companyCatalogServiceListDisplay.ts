import type { TFunction } from 'i18next'
import type { HydratedCatalogItem } from '../types/companyCatalog.types'

export type CompanyServiceTimeMode = 'duration' | 'window'

export type CompanyServiceTimePayload = {
  timeMode?: CompanyServiceTimeMode
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

export function resolveCompanyServiceTimePayload(
  item: HydratedCatalogItem,
): CompanyServiceTimePayload {
  const raw = (item.hydrated ?? item.payload) as Record<string, unknown> | null | undefined
  if (!raw) return {}

  const timeMode =
    raw.timeMode === 'window'
      ? 'window'
      : raw.timeMode === 'duration'
        ? 'duration'
        : raw.time_mode === 'window'
          ? 'window'
          : raw.time_mode === 'duration'
            ? 'duration'
            : undefined

  const durationMinutes =
    typeof raw.durationMinutes === 'number'
      ? raw.durationMinutes
      : typeof raw.duration_minutes === 'number'
        ? raw.duration_minutes
        : null

  const startTime =
    typeof raw.startTime === 'string'
      ? raw.startTime
      : typeof raw.start_time === 'string'
        ? raw.start_time
        : null

  const endTime =
    typeof raw.endTime === 'string'
      ? raw.endTime
      : typeof raw.end_time === 'string'
        ? raw.end_time
        : null

  return { timeMode, durationMinutes, startTime, endTime }
}

export function formatCompanyServiceTimeModeLabel(
  mode: CompanyServiceTimeMode | undefined,
  t: TFunction<'catalog'>,
): string {
  if (mode === 'window') return t('serviceWizard.fields.specificTime')
  if (mode === 'duration') return t('serviceWizard.fields.duration')
  return '—'
}

export function formatCompanyServiceScheduleSummary(
  item: HydratedCatalogItem,
  t: TFunction<'catalog'>,
): string {
  const { timeMode, durationMinutes, startTime, endTime } = resolveCompanyServiceTimePayload(item)

  if (timeMode === 'duration') {
    return durationMinutes != null ? t('detail.durationMinutes', { count: durationMinutes }) : '—'
  }
  if (timeMode === 'window') {
    const start = startTime?.trim()
    const end = endTime?.trim()
    if (start && end) return `${start} – ${end}`
    if (start) return start
    if (end) return end
    return '—'
  }
  return '—'
}

export function companyServiceListHasTimeMeta(item: HydratedCatalogItem): boolean {
  const { timeMode } = resolveCompanyServiceTimePayload(item)
  return timeMode != null
}
