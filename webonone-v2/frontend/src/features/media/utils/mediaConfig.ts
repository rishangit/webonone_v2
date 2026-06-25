const DEFAULT_MEDIA_ORIGIN = 'http://localhost:3003'
const DEFAULT_MEDIA_API = 'http://localhost:4003/api/v1'
const DEFAULT_DEMO_SITE_ID = 'demo00000000000000001'

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getMediaPickerUrl(): string {
  return `${getMediaOrigin()}/picker`
}

export function getMediaUploadUrl(): string {
  return `${getMediaOrigin()}/upload`
}

export function getMediaUploadDialogUrl(): string {
  return `${getMediaOrigin()}/upload-dialog`
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

export function getMediaViewerUrl(): string {
  return `${getMediaOrigin()}/viewer`
}

export function getMediaDialogUrl(): string {
  return `${getMediaOrigin()}/dialog`
}

export function getMediaApiBase(): string {
  return import.meta.env.VITE_MEDIA_API_BASE_URL ?? DEFAULT_MEDIA_API
}

export function getDemoSiteId(): string {
  return import.meta.env.VITE_DEMO_SITE_ID ?? DEFAULT_DEMO_SITE_ID
}

export function buildDemoMediaScope(): string {
  return `webonone:site:${getDemoSiteId()}`
}
