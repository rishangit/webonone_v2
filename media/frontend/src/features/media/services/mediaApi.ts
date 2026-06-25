import type { MediaItemDto } from '@webonone/media-embed'
import { apiClient } from '@/shared/services/apiClient'

export interface MediaListResponse {
  items: MediaItemDto[]
  total: number
  page: number
  pageSize: number
}

export interface MediaFolderDto {
  id: string
  scope: string
  path: string
  name: string
  createdAt: string
}

export async function listMediaItems(params: {
  scope: string
  folderPath?: string
  page?: number
  pageSize?: number
  mimeType?: string
}): Promise<MediaListResponse> {
  const search = new URLSearchParams({
    scope: params.scope,
    folderPath: params.folderPath ?? '/',
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 24),
  })
  if (params.mimeType) {
    search.set('mimeType', params.mimeType)
  }
  return apiClient<MediaListResponse>(`/media?${search.toString()}`)
}

export async function uploadMediaFile(
  file: File,
  scope: string,
  folderPath: string,
): Promise<{ item: MediaItemDto }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scope', scope)
  formData.append('folderPath', folderPath)
  return apiClient<{ item: MediaItemDto }>('/media/upload', {
    method: 'POST',
    body: formData,
  })
}

export async function uploadMediaBatch(
  files: File[],
  scope: string,
  folderPath: string,
): Promise<{ items: MediaItemDto[]; failed: { fileName: string; reason: string }[] }> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  formData.append('scope', scope)
  formData.append('folderPath', folderPath)
  return apiClient('/media/upload/batch', {
    method: 'POST',
    body: formData,
  })
}

export async function getMediaItem(id: string): Promise<{ item: MediaItemDto }> {
  return apiClient(`/media/${id}`)
}

export async function deleteMediaItem(id: string): Promise<void> {
  await apiClient(`/media/${id}`, { method: 'DELETE' })
}

export async function listFolders(scope: string, parentPath = '/'): Promise<{ folders: MediaFolderDto[] }> {
  const search = new URLSearchParams({ scope, parentPath })
  return apiClient(`/folders?${search.toString()}`)
}

export async function createFolder(scope: string, path: string, name: string): Promise<{ folder: MediaFolderDto }> {
  return apiClient('/folders', {
    method: 'POST',
    body: JSON.stringify({ scope, path, name }),
  })
}
