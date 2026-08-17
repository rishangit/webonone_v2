const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

export function getMediaCropDialogUrl(): string {
  return `${getMediaOrigin()}/crop-dialog`
}

/** Scope webonone:company:{companyId} → disk webonone/companies/{companyId}/ */
export function buildWebsiteMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

/** Website images → webonone/companies/{companyId}/web/ */
export function buildWebsiteFolderPath(): string {
  return '/web'
}
