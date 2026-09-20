import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { SelectTagValue } from '@webonone/mobile-ui'

type TagRow = {
  id: string
  name: string
  color: string
}

type ListTagsResponse = {
  items: TagRow[]
  total: number
  page: number
  pageSize: number
}

function dataApiBaseUrl(): string {
  return `${env.dataOrigin.replace(/\/+$/, '')}/api/v1`
}

const client = createApiClient(dataApiBaseUrl())

export async function listCatalogTags(params?: { search?: string }): Promise<SelectTagValue[]> {
  const search = new URLSearchParams()
  search.set('page', '1')
  search.set('pageSize', '200')
  if (params?.search?.trim()) search.set('q', params.search.trim())

  const data = await client<ListTagsResponse>(`/tags?${search.toString()}`)
  return data.items.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }))
}
