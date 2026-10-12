import type { TFunction } from 'i18next'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'

export function formatPublicServiceTimeModeLabel(
  mode: CatalogSearchItem['timeMode'],
  t: TFunction<'catalog'>,
): string {
  if (mode === 'window') return t('timeModeWindow')
  if (mode === 'duration') return t('timeModeDuration')
  return '—'
}

export function formatPublicServiceScheduleSummary(
  item: CatalogSearchItem,
  t: TFunction<'catalog'>,
): string {
  const mode = item.timeMode
  if (mode === 'duration') {
    return item.durationMinutes != null
      ? t('durationValue', { count: item.durationMinutes })
      : '—'
  }
  if (mode === 'window') {
    const start = item.startTime?.trim()
    const end = item.endTime?.trim()
    if (start && end) return `${start} – ${end}`
    if (start) return start
    if (end) return end
    return '—'
  }
  return '—'
}

export function resolvePublicServiceListPrice(item: CatalogSearchItem): number | null {
  const price = item.listPrice
  if (price == null || Number.isNaN(price)) return null
  return price
}
