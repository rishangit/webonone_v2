import type { TFunction } from 'i18next'
import type { CatalogItem, ServiceTimeMode } from '@/shared/types/data.types'

type ServiceListSource = CatalogItem & {
  time_mode?: ServiceTimeMode
  duration_minutes?: number | null
  start_time?: string | null
  end_time?: string | null
}

export function normalizeServiceListItem(item: CatalogItem): CatalogItem {
  const raw = item as ServiceListSource
  return {
    ...item,
    timeMode: item.timeMode ?? raw.time_mode,
    durationMinutes: item.durationMinutes ?? raw.duration_minutes ?? null,
    startTime: item.startTime ?? raw.start_time ?? null,
    endTime: item.endTime ?? raw.end_time ?? null,
  }
}

export function formatServiceTimeModeLabel(
  mode: ServiceTimeMode | undefined,
  t: TFunction<'services'>,
): string {
  if (mode === 'window') return t('timeModeWindow')
  if (mode === 'duration') return t('timeModeDuration')
  return '—'
}

export function formatServiceScheduleSummary(item: CatalogItem, t: TFunction<'services'>): string {
  const service = normalizeServiceListItem(item)
  const mode = service.timeMode
  if (mode === 'duration') {
    return service.durationMinutes != null
      ? t('durationValue', { count: service.durationMinutes })
      : '—'
  }
  if (mode === 'window') {
    const start = service.startTime?.trim()
    const end = service.endTime?.trim()
    if (start && end) return `${start} – ${end}`
    if (start) return start
    if (end) return end
    return '—'
  }
  return '—'
}
