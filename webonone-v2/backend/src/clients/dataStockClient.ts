import { env } from '../config/env.js'

export type DataProductVariantSummary = {
  id: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
}

export type DataStockConsumeResult = {
  id: string
  variantId: string
  quantity: number
  costPrice: number
}

function apiBase(): string {
  if (!env.dataApiBaseUrl) {
    throw new Error('DATA_API_BASE_URL not configured')
  }
  return env.dataApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

export function hasDataStockConfig(): boolean {
  return Boolean(env.dataApiBaseUrl?.trim() && env.dataServiceApiKey?.trim())
}

async function internalRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!hasDataStockConfig()) {
    throw new Error('DATA_API_DISABLED')
  }
  const res = await fetch(`${apiBase()}/api/v1/internal/${path}`, {
    method,
    headers: {
      'X-Data-Service-Key': env.dataServiceApiKey,
      'Content-Type': 'application/json',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof (data as { message?: string }).message === 'string'
        ? (data as { message: string }).message
        : `Data stock request failed (${res.status})`
    const err = new Error(message) as Error & { statusCode?: number }
    err.statusCode = res.status
    throw err
  }
  return data as T
}

export async function getLibraryProductVariant(
  productId: string,
  variantId: string,
): Promise<DataProductVariantSummary | null> {
  try {
    return await internalRequest<DataProductVariantSummary>(
      'GET',
      `products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    )
  } catch (err) {
    if (err instanceof Error && (err as { statusCode?: number }).statusCode === 404) {
      return null
    }
    throw err
  }
}

export type DataStockSummary = {
  id: string
  variantId: string
  costPrice: number
}

export async function getLibraryStock(input: {
  productId: string
  variantId: string
  stockId: string
}): Promise<DataStockSummary | null> {
  try {
    const stock = await internalRequest<{ id: string; variantId: string; costPrice: number }>(
      'GET',
      `products/${encodeURIComponent(input.productId)}/variants/${encodeURIComponent(input.variantId)}/stocks/${encodeURIComponent(input.stockId)}`,
    )
    return { id: stock.id, variantId: stock.variantId, costPrice: Number(stock.costPrice) }
  } catch (err) {
    if (err instanceof Error && (err as { statusCode?: number }).statusCode === 404) {
      return null
    }
    throw err
  }
}

export async function consumeLibraryStock(input: {
  productId: string
  variantId: string
  stockId: string
  quantity: number
}): Promise<DataStockConsumeResult> {
  const stock = await internalRequest<{
    id: string
    variantId: string
    quantity: number
    costPrice: number
  }>(
    'POST',
    `products/${encodeURIComponent(input.productId)}/variants/${encodeURIComponent(input.variantId)}/stocks/${encodeURIComponent(input.stockId)}/consume`,
    { quantity: input.quantity },
  )
  return {
    id: stock.id,
    variantId: stock.variantId,
    quantity: stock.quantity,
    costPrice: Number(stock.costPrice),
  }
}
