import {
  listInternalTagsByIds,
  listInternalTagsByQuery,
  listLibraryItemsByIds,
  listMatchingLibraryIds,
  type CatalogKind,
  type DataLibraryCatalogItem,
  type DataTagSummary,
} from '../clients/dataCatalogClient.js'
import {
  findApprovedCompanyCatalogById,
  isSellableCatalogKind,
  parseGalleryImages,
  parseTagIds,
  searchApprovedCompanyCatalog,
  type PublicCatalogSearchRow,
} from '../repositories/publicCatalogSearch.repository.js'
import { distanceKm, parseLatLng, toFiniteNumber } from '../utils/geo.js'

export type PublicCatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
  distanceKm: number | null
  latitude: number | null
  longitude: number | null
}

export type PublicCatalogDetailItem = PublicCatalogSearchItem & {
  galleryImages: Array<{ mediaId: string; url: string }>
}

export type PublicCatalogSearchResult = {
  items: PublicCatalogSearchItem[]
  total: number
  page: number
  pageSize: number
}

type HydratedCatalogItem = Omit<PublicCatalogSearchItem, 'distanceKm' | 'latitude' | 'longitude'> & {
  companyLatitude: number | null
  companyLongitude: number | null
}

const KINDS: CatalogKind[] = ['products', 'services', 'spaces']

function emptyResult(page: number, pageSize: number): PublicCatalogSearchResult {
  return { items: [], total: 0, page, pageSize }
}

function parsePage(raw: unknown): number {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

function parsePageSize(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 20
  return Math.min(100, Math.max(1, Math.floor(n)))
}

function tagsFromLibrary(
  library: DataLibraryCatalogItem | undefined,
  tagById: Map<string, DataTagSummary>,
  localTagIds: string[],
): Array<{ id: string; name: string; color?: string }> {
  if (library?.tags?.length) {
    return library.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }))
  }
  const tags: Array<{ id: string; name: string; color?: string }> = []
  for (const id of localTagIds) {
    const tag = tagById.get(id)
    if (!tag) continue
    tags.push({ id: tag.id, name: tag.name, color: tag.color })
  }
  return tags
}

function companyCoords(row: PublicCatalogSearchRow): {
  companyLatitude: number | null
  companyLongitude: number | null
} {
  return {
    companyLatitude: toFiniteNumber(row.company_latitude),
    companyLongitude: toFiniteNumber(row.company_longitude),
  }
}

async function hydrateRows(rows: PublicCatalogSearchRow[]): Promise<HydratedCatalogItem[]> {
  const libraryIdsByKind: Record<CatalogKind, string[]> = {
    products: [],
    services: [],
    spaces: [],
  }
  const allLocalTagIds = new Set<string>()

  for (const row of rows) {
    if (row.binding_mode === 'linked' && row.library_entity_id) {
      libraryIdsByKind[row.kind].push(row.library_entity_id)
    }
    for (const tagId of parseTagIds(row.tag_ids)) {
      allLocalTagIds.add(tagId)
    }
  }

  const libraryByKind = new Map<CatalogKind, Map<string, DataLibraryCatalogItem>>()
  await Promise.all(
    KINDS.map(async (kind) => {
      const items = await listLibraryItemsByIds(kind, libraryIdsByKind[kind])
      libraryByKind.set(kind, new Map(items.map((item) => [item.id, item])))
      for (const item of items) {
        for (const tag of item.tags ?? []) {
          allLocalTagIds.add(tag.id)
        }
      }
    }),
  )

  const tagRows = await listInternalTagsByIds([...allLocalTagIds])
  const tagById = new Map(tagRows.map((tag) => [tag.id, tag]))

  const items: HydratedCatalogItem[] = []
  for (const row of rows) {
    const localTagIds = parseTagIds(row.tag_ids)
    const coords = companyCoords(row)
    if (row.binding_mode === 'linked') {
      const library = row.library_entity_id
        ? libraryByKind.get(row.kind)?.get(row.library_entity_id)
        : undefined
      if (!library) {
        continue
      }
      items.push({
        id: row.id,
        kind: row.kind,
        name: library.name,
        description: library.description ?? null,
        companyId: row.company_id,
        companyName: row.company_name,
        tags: tagsFromLibrary(library, tagById, localTagIds),
        ...coords,
      })
      continue
    }

    const name = typeof row.name === 'string' && row.name.trim() ? row.name.trim() : null
    if (!name) continue

    items.push({
      id: row.id,
      kind: row.kind,
      name,
      description: row.description ?? null,
      companyId: row.company_id,
      companyName: row.company_name,
      tags: tagsFromLibrary(undefined, tagById, localTagIds),
      ...coords,
    })
  }

  return items
}

function withDistance(
  items: HydratedCatalogItem[],
  origin: { lat: number; lng: number } | null,
): PublicCatalogSearchItem[] {
  return items.map((item) => {
    const { companyLatitude, companyLongitude, ...rest } = item
    let distance: number | null = null
    if (
      origin &&
      companyLatitude != null &&
      companyLongitude != null
    ) {
      distance = Math.round(distanceKm(origin.lat, origin.lng, companyLatitude, companyLongitude) * 10) / 10
    }
    return {
      ...rest,
      distanceKm: distance,
      latitude: companyLatitude,
      longitude: companyLongitude,
    }
  })
}

function sortCatalogItems(
  items: PublicCatalogSearchItem[],
  byDistance: boolean,
): void {
  if (byDistance) {
    items.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) {
        return a.name.localeCompare(b.name) || a.companyName.localeCompare(b.companyName)
      }
      if (a.distanceKm == null) return 1
      if (b.distanceKm == null) return -1
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
      return a.name.localeCompare(b.name) || a.companyName.localeCompare(b.companyName)
    })
    return
  }

  items.sort((a, b) => a.name.localeCompare(b.name) || a.companyName.localeCompare(b.companyName))
}

export async function searchPublicCatalog(query: {
  q?: string
  page?: unknown
  pageSize?: unknown
  lat?: unknown
  lng?: unknown
}): Promise<PublicCatalogSearchResult> {
  const page = parsePage(query.page)
  const pageSize = parsePageSize(query.pageSize)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  if (!q) {
    return emptyResult(page, pageSize)
  }

  const origin = parseLatLng(query)

  const matchedTags = await listInternalTagsByQuery(q)
  const matchedTagIds = matchedTags.map((tag) => tag.id)

  const libraryIdsByKind: Record<CatalogKind, string[]> = {
    products: [],
    services: [],
    spaces: [],
  }
  await Promise.all(
    KINDS.map(async (kind) => {
      libraryIdsByKind[kind] = await listMatchingLibraryIds(kind, {
        q,
        tagIds: matchedTagIds,
      })
    }),
  )

  const rows = await searchApprovedCompanyCatalog({
    q,
    matchedTagIds,
    libraryIdsByKind,
  })

  const hydrated = await hydrateRows(rows)
  const itemsWithDistance = withDistance(hydrated, origin)
  sortCatalogItems(itemsWithDistance, origin != null)

  const total = itemsWithDistance.length
  const start = (page - 1) * pageSize
  const items = itemsWithDistance.slice(start, start + pageSize)

  return { items, total, page, pageSize }
}

export async function getPublicCatalogItem(options: {
  kind: string
  id: string
  lat?: unknown
  lng?: unknown
}): Promise<PublicCatalogDetailItem | null> {
  if (!isSellableCatalogKind(options.kind)) return null
  const id = typeof options.id === 'string' ? options.id.trim() : ''
  if (!id) return null

  const row = await findApprovedCompanyCatalogById(options.kind, id)
  if (!row) return null

  const hydrated = await hydrateRows([row])
  if (hydrated.length === 0) return null

  const origin = parseLatLng(options)
  const [item] = withDistance(hydrated, origin)
  if (!item) return null

  return {
    ...item,
    galleryImages: parseGalleryImages(row.gallery_images),
  }
}
