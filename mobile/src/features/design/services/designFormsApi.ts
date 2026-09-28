import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

const client = createApiClient(env.designApiBaseUrl)

export type DesignFormTemplateListItem = {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published'
}

export const designFormsApi = {
  listPublished(pageSize = 100) {
    return client<{
      items: DesignFormTemplateListItem[]
      total: number
    }>(`/forms?status=published&pageSize=${pageSize}`)
  },
}
