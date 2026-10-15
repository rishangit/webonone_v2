import type { CatalogPriceRule } from '@/features/company-catalog/types/catalogPriceRule.types'

const DAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const

type Translate = (key: string, options?: Record<string, unknown>) => string

export function formatCatalogPriceWhen(rule: CatalogPriceRule, t: Translate): string {
  if (rule.applyWhen === 'all_time') return t('priceList.allTime')
  const days = rule.weekdays.map((day) => t(`priceList.days.${DAY_KEYS[day] ?? day}`)).join(', ')
  const time =
    rule.startTime && rule.endTime
      ? `${rule.startTime}–${rule.endTime}`
      : t('priceList.fullDay')
  return `${days} · ${time}`
}
