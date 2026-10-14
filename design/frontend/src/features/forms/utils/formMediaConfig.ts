const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'

export function getFormMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getFormMediaSelectorUrl(): string {
  return `${getFormMediaOrigin()}/selector`
}

/** Company-scoped Media storage (same convention as website designer). */
export function buildFormMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

/** Uploaded form attachments → webonone/companies/{companyId}/forms/ */
export function buildFormMediaFolderPath(): string {
  return '/forms'
}
