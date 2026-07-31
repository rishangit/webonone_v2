import { db } from '../models/db.js'
import type { CatalogKind } from '../clients/dataCatalogClient.js'
import { CATALOG_TABLE_BY_KIND } from './companyCatalog.repository.js'

export type PublicCatalogSearchRow = {
  id: string
  company_id: string
  company_name: string
  binding_mode: 'linked' | 'forked' | 'custom'
  library_entity_id: string | null
  name: string | null
  description: string | null
  status: 'verified' | 'pending' | null
  tag_ids: string | unknown[] | null
  kind: CatalogKind
}

const SELLABLE_KINDS: CatalogKind[] = ['products', 'services', 'spaces']

function parseJsonStringArray(value: string | unknown[] | null): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.filter((entry): entry is string => typeof entry === 'string')
    } catch {
      return []
    }
  }
  return []
}

export function parseTagIds(value: string | unknown[] | null): string[] {
  return parseJsonStringArray(value)
}

/**
 * Find company catalog sellables matching text and/or tag / library filters.
 * Only approved companies. Forked/custom must be verified; linked rows are included
 * when they match via library id or (rare) local fields.
 */
export async function searchApprovedCompanyCatalog(options: {
  q: string
  matchedTagIds: string[]
  libraryIdsByKind: Record<CatalogKind, string[]>
}): Promise<PublicCatalogSearchRow[]> {
  const { q, matchedTagIds, libraryIdsByKind } = options
  const pattern = `%${q}%`
  const rows: PublicCatalogSearchRow[] = []

  for (const kind of SELLABLE_KINDS) {
    const table = CATALOG_TABLE_BY_KIND[kind]
    const libraryIds = libraryIdsByKind[kind] ?? []

    const query = db(`${table} as item`)
      .join('companies as company', 'company.id', 'item.company_id')
      .where('company.status', 'approved')
      .andWhere(function sellable() {
        this.where('item.binding_mode', 'linked').orWhere(function verifiedLocal() {
          this.whereIn('item.binding_mode', ['forked', 'custom']).andWhere(
            'item.status',
            'verified',
          )
        })
      })
      .andWhere(function match() {
        this.where('item.name', 'like', pattern).orWhere('item.description', 'like', pattern)

        if (matchedTagIds.length > 0) {
          for (const tagId of matchedTagIds) {
            this.orWhereRaw('JSON_CONTAINS(item.tag_ids, CAST(? AS JSON), \'$\')', [
              JSON.stringify(tagId),
            ])
          }
        }

        if (libraryIds.length > 0) {
          this.orWhere(function linkedLibrary() {
            this.where('item.binding_mode', 'linked').whereIn(
              'item.library_entity_id',
              libraryIds,
            )
          })
        }
      })
      .select(
        'item.id',
        'item.company_id',
        'company.name as company_name',
        'item.binding_mode',
        'item.library_entity_id',
        'item.name',
        'item.description',
        'item.status',
        'item.tag_ids',
      )
      .orderBy('item.updated_at', 'desc')
      .limit(500)

    const kindRows = (await query) as Array<Omit<PublicCatalogSearchRow, 'kind'>>
    for (const row of kindRows) {
      rows.push({ ...row, kind })
    }
  }

  return rows
}
