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

export function buildProfileMediaScope(userId: string): string {
  return `identity:user:${userId}`
}

/** Folder under scope identity:user:{userId} → disk identity/users/{userId}/ */
export function buildProfileFolderPath(_userId: string): string {
  return '/'
}
