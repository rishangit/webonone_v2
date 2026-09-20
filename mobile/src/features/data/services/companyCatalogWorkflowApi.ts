import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

const client = createApiClient(env.webononeApiBaseUrl)

export type ServiceWorkflowStaff = {
  id: string
  displayName: string
}

export type ServiceWorkflowForm = {
  id: string
  name?: string
}

export type ServiceWorkflowItem = {
  id: string
  kind: 'check_in' | 'space'
  orderNumber: number
  space: { id: string; name: string } | null
  staff: ServiceWorkflowStaff[]
  forms: ServiceWorkflowForm[]
  sessionQueue: boolean
  addItemsEnabled: boolean
  addItemsFromLibraryEnabled: boolean
}

type CompanyCatalogService = {
  id: string
  libraryEntityId: string | null
}

export async function resolveCompanyCatalogServiceId(libraryOrCatalogId: string): Promise<string | null> {
  const result = await client<{ items: CompanyCatalogService[] }>('/company/me/catalog/services')
  const match = (result.items ?? []).find(
    (item) => item.id === libraryOrCatalogId || item.libraryEntityId === libraryOrCatalogId,
  )
  return match?.id ?? null
}

export function listServiceWorkflow(serviceId: string) {
  return client<{ items: ServiceWorkflowItem[] }>(
    `/company/me/catalog/services/${encodeURIComponent(serviceId)}/workflow`,
  )
}
