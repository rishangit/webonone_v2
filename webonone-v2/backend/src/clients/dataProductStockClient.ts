import { env } from '../config/env.js'

export type DataLibraryProductVariant = {
  id: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
  values: Array<{
    attributeId: string
    attributeName: string
    attributeValueId: string
    valueText: string | null
    valueNumber: number | null
    valueType: 'number' | 'text'
    unitSymbol: string | null
  }>
}

function apiBase(): string {
  if (!env.dataApiBaseUrl) {
    throw new Error('DATA_API_BASE_URL not configured')
  }
  return env.dataApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function hasConfig(): boolean {
  return Boolean(env.dataApiBaseUrl?.trim() && env.dataServiceApiKey?.trim())
}

async function internalRequest<T>(path: string): Promise<T> {
  if (!hasConfig()) {
    throw new Error('DATA_API_DISABLED')
  }
  const res = await fetch(`${apiBase()}/api/v1/internal/${path}`, {
    headers: {
      'X-Data-Service-Key': env.dataServiceApiKey,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof (data as { message?: string }).message === 'string'
        ? (data as { message: string }).message
        : `Data product stock request failed (${res.status})`
    throw new Error(message)
  }
  return data as T
}

export async function listLibraryProductVariants(
  libraryProductId: string,
): Promise<DataLibraryProductVariant[]> {
  const result = await internalRequest<{ items: DataLibraryProductVariant[] }>(
    `products/${encodeURIComponent(libraryProductId)}/variants`,
  )
  return result.items ?? []
}
