const DEFAULT_MEDIA_ORIGIN = 'http://localhost:3013'

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getUploadDialogUrl(): string {
  return `${getMediaOrigin()}/upload-dialog`
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

export function getMediaCropDialogUrl(): string {
  return `${getMediaOrigin()}/crop-dialog`
}

export function buildCompanyMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

export function buildCompanyProfileFolderPath(companyId: string): string {
  return `/companies/${companyId}/profile`
}

export function buildCompanyGalleryFolderPath(companyId: string): string {
  return `/companies/${companyId}/gallery`
}

/**
 * Media folder for company catalog entity galleries (services / spaces).
 * Path: /company/{companyId}/{entityKind}/{entityId}/gallery
 * Scope: webonone:company:{companyId} via buildCompanyMediaScope
 */
export function buildCatalogEntityGalleryFolderPath(
  companyId: string,
  entityKind: 'services' | 'spaces',
  entityId: string,
): string {
  return `/company/${companyId}/${entityKind}/${entityId}/gallery`
}
