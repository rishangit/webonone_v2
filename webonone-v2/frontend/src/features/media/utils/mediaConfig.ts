const DEFAULT_MEDIA_ORIGIN = 'http://localhost:3003'

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getUploadDialogUrl(): string {
  return `${getMediaOrigin()}/upload-dialog`
}

export function buildCompanyLogoScope(userId: string): string {
  return `webonone:company:pending:${userId}`
}

export function buildCompanyLogoFolderPath(): string {
  return '/logo'
}
