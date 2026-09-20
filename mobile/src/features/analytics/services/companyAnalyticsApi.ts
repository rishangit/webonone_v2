import type {
  CompanyAnalytics,
  PlatformAnalytics,
} from '@/features/analytics/types/analytics.types'
import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

const client = createApiClient(env.webononeApiBaseUrl)

export const companyAnalyticsApi = {
  getCompany(from: string, to: string) {
    const params = new URLSearchParams({ from, to })
    return client<CompanyAnalytics>(`/company/me/analytics?${params.toString()}`)
  },
  getPlatform(from: string, to: string) {
    const params = new URLSearchParams({ from, to })
    return client<PlatformAnalytics>(`/company/analytics/platform?${params.toString()}`)
  },
}
