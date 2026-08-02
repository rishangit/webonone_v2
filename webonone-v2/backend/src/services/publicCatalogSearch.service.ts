import {
  listInternalTagsByIds,
  listInternalTagsByQuery,
  listLibraryItemsByIds,
  listMatchingLibraryIds,
  type CatalogKind,
  type DataLibraryCatalogItem,
  type DataTagSummary,
} from '../clients/dataCatalogClient.js'
import { listWindowEventsByService } from '../repositories/companyEvent.repository.js'
import {
  findApprovedCompanyCatalogById,
  isSellableCatalogKind,
  parseGalleryImages,
  parseTagIds,
  searchApprovedCompanyCatalog,
  type PublicCatalogSearchRow,
} from '../repositories/publicCatalogSearch.repository.js'
import { expandOccurrences, mapEventRow } from './companyEvent.service.js'
import { distanceKm, parseLatLng, toFiniteNumber } from '../utils/geo.js'

export type PublicCatalogGalleryImage = {
  mediaId: string
  url: string
}

export type PublicCatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
  imageUrl: string | null
  distanceKm: number | null
  latitude: number | null
  longitude: number | null
}

export type PublicCatalogDetailItem = PublicCatalogSearchItem & {
  galleryImages: PublicCatalogGalleryImage[]
  /** Services only. */
  timeMode?: 'duration' | 'window' | null
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

export type PublicCatalogSearchResult = {
  items: PublicCatalogSearchItem[]
  total: number
  page: number
  pageSize: number
}

export type PublicCatalogSessionItem = {
  eventId: string
  occurrenceDate: string
  startTime: string
  endTime: string
  serviceName: string
  companyId: string
}

type ServiceTimeFields = {
  timeMode: 'duration' | 'window' | null
  durationMinutes: number | null
  startTime: string | null
  endTime: string | null
}

type HydratedCatalogItem = Omit<
  PublicCatalogSearchItem,
  'distanceKm' | 'latitude' | 'longitude' | 'imageUrl'
> & {
  companyLatitude: number | null
  companyLongitude: number | null
  galleryImages: PublicCatalogGalleryImage[]
  timeMode: 'duration' | 'window' | null
  durationMinutes: number | null
  startTime: string | null
  endTime: string | null
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

function parseLibraryGallery(item: DataLibraryCatalogItem | undefined): PublicCatalogGalleryImage[] {
  if (!item || !Array.isArray(item.galleryImages)) return []
  return item.galleryImages.filter(
    (entry): entry is PublicCatalogGalleryImage =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof entry.mediaId === 'string' &&
      typeof entry.url === 'string',
  )
}

function formatTime(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const match = /^(\d{2}:\d{2})/.exec(value)
    return match?.[1] ?? value.slice(0, 5)
  }
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function emptyServiceTime(): ServiceTimeFields {
  return {
    timeMode: null,
    durationMinutes: null,
    startTime: null,
    endTime: null,
  }
}

function resolveServiceTime(
  row: PublicCatalogSearchRow,
  library: DataLibraryCatalogItem | undefined,
): ServiceTimeFields {
  if (row.kind !== 'services') return emptyServiceTime()

  if (row.binding_mode === 'linked') {
    const mode = library?.timeMode
    if (mode !== 'duration' && mode !== 'window') return emptyServiceTime()
    return {
      timeMode: mode,
      durationMinutes: library?.durationMinutes ?? null,
      startTime: formatTime(library?.startTime ?? null),
      endTime: formatTime(library?.endTime ?? null),
    }
  }

  const mode = row.time_mode
  if (mode !== 'duration' && mode !== 'window') return emptyServiceTime()
  return {
    timeMode: mode,
    durationMinutes: row.duration_minutes ?? null,
    startTime: formatTime(row.start_time ?? null),
    endTime: formatTime(row.end_time ?? null),
  }
}

/** Linked + null company gallery → library gallery; else company override. */
function effectiveGalleryImages(
  row: PublicCatalogSearchRow,
  library: DataLibraryCatalogItem | undefined,
): PublicCatalogGalleryImage[] {
  if (row.binding_mode === 'linked' && row.gallery_images == null) {
    return parseLibraryGallery(library)
  }
  return parseGalleryImages(row.gallery_images)
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
      const time = resolveServiceTime(row, library)
      items.push({
        id: row.id,
        kind: row.kind,
        name: library.name,
        description: library.description ?? null,
        companyId: row.company_id,
        companyName: row.company_name,
        tags: tagsFromLibrary(library, tagById, localTagIds),
        galleryImages: effectiveGalleryImages(row, library),
        ...coords,
        ...time,
      })
      continue
    }

    const name = typeof row.name === 'string' && row.name.trim() ? row.name.trim() : null
    if (!name) continue

    const time = resolveServiceTime(row, undefined)
    items.push({
      id: row.id,
      kind: row.kind,
      name,
      description: row.description ?? null,
      companyId: row.company_id,
      companyName: row.company_name,
      tags: tagsFromLibrary(undefined, tagById, localTagIds),
      galleryImages: effectiveGalleryImages(row, undefined),
      ...coords,
      ...time,
    })
  }

  return items
}

function withDistance(
  items: HydratedCatalogItem[],
  origin: { lat: number; lng: number } | null,
): PublicCatalogSearchItem[] {
  return items.map((item) => {
    const {
      companyLatitude,
      companyLongitude,
      galleryImages,
      timeMode: _timeMode,
      durationMinutes: _durationMinutes,
      startTime: _startTime,
      endTime: _endTime,
      ...rest
    } = item
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
      imageUrl: galleryImages[0]?.url ?? null,
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

  const detail = hydrated[0]!
  return {
    ...item,
    galleryImages: detail.galleryImages,
    timeMode: detail.timeMode,
    durationMinutes: detail.durationMinutes,
    startTime: detail.startTime,
    endTime: detail.endTime,
  }
}

function toDateOnly(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  date.setDate(date.getDate() + days)
  return toDateOnly(date)
}

function parseYmdParam(raw: unknown, fallback: string): string {
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return fallback
}

/**
 * Upcoming Specific-time (window) event sessions for a public marketplace service.
 */
export async function listPublicServiceSessions(options: {
  serviceId: string
  from?: unknown
  to?: unknown
}): Promise<{ items: PublicCatalogSessionItem[] }> {
  const serviceId = typeof options.serviceId === 'string' ? options.serviceId.trim() : ''
  if (!serviceId) return { items: [] }

  const row = await findApprovedCompanyCatalogById('services', serviceId)
  if (!row) return { items: [] }

  const today = toDateOnly(new Date())
  const from = parseYmdParam(options.from, today)
  const to = parseYmdParam(options.to, addDaysYmd(today, 30))
  if (to < from) return { items: [] }

  const eventRows = await listWindowEventsByService(row.company_id, serviceId)
  const items: PublicCatalogSessionItem[] = []
  for (const eventRow of eventRows) {
    const event = mapEventRow(eventRow)
    for (const occurrence of expandOccurrences(event, from, to)) {
      items.push({
        eventId: occurrence.id,
        occurrenceDate: occurrence.occurrenceDate,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        serviceName: occurrence.serviceName,
        companyId: occurrence.companyId,
      })
    }
  }

  items.sort((a, b) => {
    const byDate = a.occurrenceDate.localeCompare(b.occurrenceDate)
    if (byDate !== 0) return byDate
    return a.startTime.localeCompare(b.startTime)
  })

  return { items }
}
