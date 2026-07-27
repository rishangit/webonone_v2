const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'

export type LibraryGalleryKind = 'products' | 'services' | 'spaces'

const KIND_SINGULAR: Record<LibraryGalleryKind, string> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

export function getMediaCropDialogUrl(): string {
  return `${getMediaOrigin()}/crop-dialog`
}

/** Media scope: data:{kindSingular}:{entityId} → disk data/{kindPlural}/{entityId}/ */
export function buildLibraryMediaScope(kind: LibraryGalleryKind, entityId: string): string {
  return `data:${KIND_SINGULAR[kind]}:${entityId}`
}

/** Images live at scope root (no nested gallery folder). */
export function buildLibraryGalleryFolderPath(
  _kind: LibraryGalleryKind,
  _entityId: string,
): string {
  return '/'
}

export function libraryKindSingular(kind: LibraryGalleryKind): string {
  return KIND_SINGULAR[kind]
}
