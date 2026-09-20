import { dataLibraryApi } from '@/features/sales/services/dataLibraryApi'
import type {
  CatalogEntityKind,
  CatalogGalleryImage,
  CompanyCatalogItem,
  HydratedCatalogItem,
} from '@/features/sales/types/catalog.types'

function displayFromPayload(payload: Record<string, unknown> | null | undefined) {
  const name = typeof payload?.name === 'string' ? payload.name : 'Untitled'
  const description =
    typeof payload?.description === 'string'
      ? payload.description
      : payload?.description == null
        ? null
        : String(payload.description)
  return { displayName: name, displayDescription: description }
}

function displayFromItem(item: CompanyCatalogItem) {
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

function effectiveGalleryImages(
  item: Pick<CompanyCatalogItem, 'bindingMode' | 'galleryImages'>,
  libraryGallery: CatalogGalleryImage[] | null | undefined,
): CatalogGalleryImage[] {
  if (item.bindingMode === 'linked' && item.galleryImages == null) {
    return libraryGallery ?? []
  }
  return item.galleryImages ?? []
}

export async function hydrateCatalogItems(
  kind: CatalogEntityKind,
  items: CompanyCatalogItem[],
): Promise<HydratedCatalogItem[]> {
  const linkedIds = items
    .filter((item) => item.bindingMode === 'linked' && item.libraryEntityId)
    .map((item) => item.libraryEntityId as string)

  const libraryById = new Map<string, Awaited<ReturnType<typeof dataLibraryApi.list>>['items'][number]>()

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
      // Soft degrade for linked rows
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
      const payload = library as Record<string, unknown>
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
