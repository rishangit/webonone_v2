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
  parseTagIds,
  searchApprovedCompanyCatalog,
  type PublicCatalogSearchRow,
} from '../repositories/publicCatalogSearch.repository.js'

export type PublicCatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
}

export type PublicCatalogSearchResult = {
  items: PublicCatalogSearchItem[]
  total: number
  page: number
  pageSize: number
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

async function hydrateRows(rows: PublicCatalogSearchRow[]): Promise<PublicCatalogSearchItem[]> {
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

  const items: PublicCatalogSearchItem[] = []
  for (const row of rows) {
    const localTagIds = parseTagIds(row.tag_ids)
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
    })
  }

  return items
}

export async function searchPublicCatalog(query: {
  q?: string
  page?: unknown
  pageSize?: unknown
}): Promise<PublicCatalogSearchResult> {
  const page = parsePage(query.page)
  const pageSize = parsePageSize(query.pageSize)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  if (!q) {
    return emptyResult(page, pageSize)
  }

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
  hydrated.sort((a, b) => a.name.localeCompare(b.name) || a.companyName.localeCompare(b.companyName))

  const total = hydrated.length
  const start = (page - 1) * pageSize
  const items = hydrated.slice(start, start + pageSize)

  return { items, total, page, pageSize }
}
