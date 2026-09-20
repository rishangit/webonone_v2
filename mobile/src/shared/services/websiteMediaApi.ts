import { env } from '@/shared/config/env'
import { secureStorage } from '@/shared/services/secureStorage'
import { createApiClient } from '@/shared/services/apiClient'

const mediaClient = createApiClient(env.mediaApiBaseUrl)

export type WebsiteMediaItem = {
  id: string
  url: string
  fileName?: string
  mimeType?: string
}

export function buildWebsiteMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

export function buildWebsiteFolderPath(): string {
  return '/web'
}

export async function listWebsiteMedia(input: {
  companyId: string
  page?: number
  pageSize?: number
}): Promise<{ items: WebsiteMediaItem[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams()
  params.set('scope', buildWebsiteMediaScope(input.companyId))
  params.set('folderPath', buildWebsiteFolderPath())
  params.set('page', String(input.page ?? 1))
  params.set('pageSize', String(input.pageSize ?? 12))
  params.set('mimeType', 'image/')
  return mediaClient(`/media?${params.toString()}`)
}

export async function uploadWebsiteImage(input: {
  companyId: string
  uri: string
  fileName: string
  mimeType: string
}): Promise<WebsiteMediaItem> {
  const token = await secureStorage.getAccessToken()
  if (!token) {
    throw new Error('Your session expired. Please sign in again.')
  }

  const formData = new FormData()
  formData.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob)
  formData.append('scope', buildWebsiteMediaScope(input.companyId))
  formData.append('folderPath', buildWebsiteFolderPath())

  const response = await fetch(`${env.mediaApiBaseUrl}/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      `Upload failed (${response.status})`
    throw new Error(message)
  }
  const item = data?.item as WebsiteMediaItem | undefined
  if (!item?.id || !item.url) {
    throw new Error('Upload succeeded but media response was invalid.')
  }
  return item
}

export async function deleteWebsiteMedia(id: string) {
  return mediaClient<void>(`/media/${id}`, { method: 'DELETE' })
}
