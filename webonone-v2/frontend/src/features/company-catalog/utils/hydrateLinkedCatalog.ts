import {
  dataLibraryApi,
  libraryItemToPayload,
} from '../services/dataLibraryApi'
import type {
  CatalogEntityKind,
  CatalogGalleryImage,
  CompanyCatalogItem,
  HydratedCatalogItem,
} from '../types/companyCatalog.types'

function displayFromPayload(payload: Record<string, unknown> | null | undefined): {
  displayName: string
  displayDescription: string | null
} {
  const name = typeof payload?.name === 'string' ? payload.name : 'Untitled'
  const description =
    typeof payload?.description === 'string'
      ? payload.description
      : payload?.description == null
        ? null
        : String(payload.description)
  return { displayName: name, displayDescription: description }
}

function displayFromItem(item: CompanyCatalogItem): {
  displayName: string
  displayDescription: string | null
} {
  if (typeof item.name === 'string' && item.name.trim()) {
    return {
      displayName: item.name,
      displayDescription: item.description ?? null,
    }
  }
  return displayFromPayload(item.payload)
}

function parseLibraryGallery(item: { galleryImages?: unknown }): CatalogGalleryImage[] {
  if (!Array.isArray(item.galleryImages)) return []
  return item.galleryImages.filter(
    (entry): entry is CatalogGalleryImage =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as { mediaId?: unknown }).mediaId === 'string' &&
      typeof (entry as { url?: unknown }).url === 'string',
  )
}

/** Live inherit: linked + null company gallery → library gallery; else company override. */
export function effectiveGalleryImages(
  item: Pick<CompanyCatalogItem, 'bindingMode' | 'galleryImages'>,
  libraryGallery: CatalogGalleryImage[] | null | undefined,
): CatalogGalleryImage[] {
  if (item.bindingMode === 'linked' && item.galleryImages == null) {
    return libraryGallery ?? []
  }
  return item.galleryImages ?? []
}

export async function hydrateLinkedCatalogItems(
  kind: CatalogEntityKind,
  items: CompanyCatalogItem[],
): Promise<HydratedCatalogItem[]> {
  const linkedIds = items
    .filter((item) => item.bindingMode === 'linked' && item.libraryEntityId)
    .map((item) => item.libraryEntityId as string)

  const libraryById = new Map<string, Awaited<ReturnType<typeof dataLibraryApi.get>>>()

  if (linkedIds.length > 0) {
    try {
      const result = await dataLibraryApi.list(kind, {
        ids: linkedIds,
        pageSize: Math.min(100, Math.max(linkedIds.length, 1)),
      })
      for (const entry of result.items) {
        libraryById.set(entry.id, entry)
      }
    } catch {
      // Soft degrade — linked rows show unavailable
    }
  }

  return items.map((item) => {
    if (item.bindingMode === 'linked') {
      const library = item.libraryEntityId ? libraryById.get(item.libraryEntityId) : undefined
      if (!library) {
        return {
          ...item,
          displayName: item.libraryEntityId ? `Library item ${item.libraryEntityId}` : 'Linked item',
          displayDescription: null,
          displayGalleryImages: effectiveGalleryImages(item, []),
          libraryUnavailable: true,
          hydrated: null,
        }
      }
      const payload = libraryItemToPayload(kind, library)
      const { displayName, displayDescription } = displayFromPayload(payload)
      const libraryGallery = parseLibraryGallery(library)
      return {
        ...item,
        displayName,
        displayDescription,
        displayGalleryImages: effectiveGalleryImages(item, libraryGallery),
        libraryUnavailable: false,
        hydrated: payload,
      }
    }

    const { displayName, displayDescription } = displayFromItem(item)
    return {
      ...item,
      displayName,
      displayDescription,
      displayGalleryImages: effectiveGalleryImages(item, null),
      libraryUnavailable: false,
      hydrated: item.payload,
    }
  })
}
