import { apiClient } from '@/shared/services/apiClient'
import type { CompanyAnalytics, PlatformAnalytics } from '../types/analytics.types'

export const companyAnalyticsApi = {
  getCompany(from: string, to: string) {
    const params = new URLSearchParams({ from, to })
    return apiClient<CompanyAnalytics>(`/company/me/analytics?${params.toString()}`)
  },
  getPlatform(from: string, to: string) {
    const params = new URLSearchParams({ from, to })
    return apiClient<PlatformAnalytics>(`/company/analytics/platform?${params.toString()}`)
  },
}
