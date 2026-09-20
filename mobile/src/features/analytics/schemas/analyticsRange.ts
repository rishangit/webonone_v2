import type { AnalyticsRangeKey } from '@/features/analytics/types/analytics.types'

export const ANALYTICS_RANGE_KEYS = ['7d', '30d', '90d', 'year'] as const satisfies readonly AnalyticsRangeKey[]
