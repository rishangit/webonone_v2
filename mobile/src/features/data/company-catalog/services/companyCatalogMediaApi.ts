import { env } from '@/shared/config/env'
import { secureStorage } from '@/shared/services/secureStorage'
import type { CatalogGalleryImage, CatalogEntityKind } from '@/features/sales/types/catalog.types'
import {
  buildCatalogEntityGalleryFolderPath,
  buildCompanyMediaScope,
} from '@/features/data/company-catalog/utils/mediaScope'

export async function uploadCompanyCatalogGalleryImage(input: {
  companyId: string
  kind: CatalogEntityKind
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
  formData.append('scope', buildCompanyMediaScope(input.companyId))
  formData.append(
    'folderPath',
    buildCatalogEntityGalleryFolderPath(input.companyId, input.kind, input.entityId),
  )

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
