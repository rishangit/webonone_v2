const DEFAULT_MEDIA_ORIGIN = 'http://localhost:3003'

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

export function buildProfileMediaScope(userId: string): string {
  return `identity:user:${userId}`
}

export function buildProfileFolderPath(userId: string): string {
  return `/root/users/${userId}`
}
