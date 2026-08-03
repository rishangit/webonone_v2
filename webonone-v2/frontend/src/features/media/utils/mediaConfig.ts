const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'

/** Company media navigation ceiling → disk webonone/companies/{companyId}/ */
export const COMPANY_MEDIA_SCOPED_ROOT = '/'

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

/** Scope webonone:company:{companyId} → disk webonone/companies/{companyId}/ */
export function buildCompanyMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

/** Company logo slot → webonone/companies/{id}/profile/ */
export function buildCompanyProfileFolderPath(_companyId: string): string {
  return '/profile'
}

/** Company gallery slot → webonone/companies/{id}/gallery/ */
export function buildCompanyGalleryFolderPath(_companyId: string): string {
  return '/gallery'
}

/**
 * Company catalog entity images.
 * Path: /{products|services|spaces}/{entityId}
 * Disk: webonone/companies/{companyId}/{kind}/{entityId}/
 */
export function buildCatalogEntityGalleryFolderPath(
  _companyId: string,
  entityKind: 'products' | 'services' | 'spaces',
  entityId: string,
): string {
  return `/${entityKind}/${entityId}`
}
