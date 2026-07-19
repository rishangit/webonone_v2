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

export function buildCompanyLogoScope(userId: string): string {
  return `webonone:company:pending:${userId}`
}

export function buildCompanyLogoFolderPath(): string {
  return '/logo'
}
