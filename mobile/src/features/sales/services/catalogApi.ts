import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { CatalogEntityKind, CompanyCatalogItem } from '@/features/sales/types/catalog.types'

const client = createApiClient(env.webononeApiBaseUrl)

export const catalogApi = {
  list(kind: CatalogEntityKind, query?: { q?: string }) {
    const q = query?.q?.trim()
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return client<{ items: CompanyCatalogItem[] }>(`/company/me/catalog/${kind}${qs}`)
  },
}
