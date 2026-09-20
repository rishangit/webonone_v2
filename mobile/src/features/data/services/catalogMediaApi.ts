import { env } from '@/shared/config/env'
import { secureStorage } from '@/shared/services/secureStorage'
import type { CatalogGalleryKind, CatalogGalleryImage } from '@/shared/types/data.types'

const KIND_SINGULAR: Record<CatalogGalleryKind, string> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

export function buildLibraryMediaScope(kind: CatalogGalleryKind, entityId: string): string {
  return `data:${KIND_SINGULAR[kind]}:${entityId}`
}

export async function uploadCatalogGalleryImage(input: {
  kind: CatalogGalleryKind
  entityId: string
  uri: string
  fileName: string
  mimeType: string
}): Promise<CatalogGalleryImage> {
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
  formData.append('scope', buildLibraryMediaScope(input.kind, input.entityId))
  formData.append('folderPath', '/')

  const response = await fetch(`${env.mediaApiBaseUrl}/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  const item = data?.item as { id?: string; url?: string } | undefined
  if (!item?.id || !item.url) {
    throw new Error('Upload succeeded but media response was invalid.')
  }

  return { mediaId: item.id, url: item.url }
}
