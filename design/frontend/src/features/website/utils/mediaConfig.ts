const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'
const DEFAULT_MEDIA_PUBLIC_BASE_URL = 'http://127.0.0.1:4013/api/v1'

const LOCAL_MEDIA_FILE =
  /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/v1(\/files\/[^?#]+)/i

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

/** Browser-safe Media API base used in published page image URLs. */
export function getMediaPublicBaseUrl(): string {
  const configured = import.meta.env.VITE_MEDIA_PUBLIC_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  // File URLs are served by the Media API (4013), not the Media SPA origin (3013).
  return DEFAULT_MEDIA_PUBLIC_BASE_URL
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

export function getMediaCropDialogUrl(): string {
  return `${getMediaOrigin()}/crop-dialog`
}

/** Resolve a stored MediaRef to a URL that works on the live public site. */
export function resolveMediaRefUrl(
  ref: { fileId: string; url?: string; fileName?: string } | undefined | null,
): string | null {
  if (!ref?.fileId) return null

  const trimmedUrl = ref.url?.trim()
  if (trimmedUrl) {
    const base = getMediaPublicBaseUrl()
    return trimmedUrl.replace(LOCAL_MEDIA_FILE, `${base}$1`)
  }

  const fileName = ref.fileName?.trim() || 'file'
  return `${getMediaPublicBaseUrl()}/files/${encodeURIComponent(ref.fileId)}/${encodeURIComponent(fileName)}`
}

/** Scope webonone:company:{companyId} → disk webonone/companies/{companyId}/ */
export function buildWebsiteMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

/** Website images → webonone/companies/{companyId}/web/ */
export function buildWebsiteFolderPath(): string {
  return '/web'
}
