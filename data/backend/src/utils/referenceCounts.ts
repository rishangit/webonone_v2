import { fetchCompanyCatalogReferenceCounts } from '../clients/webononeReferenceCountsClient.js'
import { db } from '../models/db.js'
import type { LibraryCatalogReferenceKind } from '../types/catalogReferenceKind.js'

export async function countTagReferences(tagId: string): Promise<number> {
  const tables = ['data_product_tags', 'data_service_tags', 'data_space_tags'] as const
  let total = 0
  for (const table of tables) {
    const rows = await db(table).where({ tag_id: tagId }).count<{ count: number }[]>('* as count')
    total += Number(rows[0]?.count ?? 0)
  }
  return total
}

export async function countUnitReferences(unitId: string): Promise<number> {
  const [attrRows, baseRows] = await Promise.all([
    db('data_attributes').where({ unit_id: unitId }).count<{ count: number }[]>('* as count'),
    db('data_units').where({ base_unit_id: unitId }).count<{ count: number }[]>('* as count'),
  ])
  return Number(attrRows[0]?.count ?? 0) + Number(baseRows[0]?.count ?? 0)
}

export async function countAttributeReferences(attributeId: string): Promise<number> {
  const tables = [
    'data_product_attributes',
    'data_service_attributes',
    'data_space_attributes',
  ] as const
  let total = 0
  for (const table of tables) {
    const rows = await db(table)
      .where({ attribute_id: attributeId })
      .count<{ count: number }[]>('* as count')
    total += Number(rows[0]?.count ?? 0)
  }
  return total
}

async function countLocalCatalogEntityReferences(
  kind: LibraryCatalogReferenceKind,
  entityIds: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(entityIds.filter((id) => id.length > 0))]
  const counts = new Map<string, number>()
  for (const id of uniqueIds) counts.set(id, 0)
  if (uniqueIds.length === 0 || kind !== 'spaces') return counts

  const rows = (await db('data_service_spaces')
    .whereIn('space_id', uniqueIds)
    .groupBy('space_id')
    .select('space_id')
    .count('* as count')) as Array<{ space_id: string; count: number }>

  for (const row of rows) {
    counts.set(row.space_id, Number(row.count ?? 0))
  }
  return counts
}

/** Company catalog links (WebOnOne) plus in-library links (e.g. services → spaces). */
export async function resolveCatalogReferenceCounts(
  kind: LibraryCatalogReferenceKind,
  entityIds: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(entityIds.filter((id) => id.length > 0))]
  const totals = new Map<string, number>()
  for (const id of uniqueIds) totals.set(id, 0)
  if (uniqueIds.length === 0) return totals

  const [localCounts, companyCounts] = await Promise.all([
    countLocalCatalogEntityReferences(kind, uniqueIds),
    fetchCompanyCatalogReferenceCounts(kind, uniqueIds),
  ])

  for (const id of uniqueIds) {
    totals.set(id, (localCounts.get(id) ?? 0) + (companyCounts.get(id) ?? 0))
  }
  return totals
}

export async function countCatalogEntityReferences(
  kind: LibraryCatalogReferenceKind,
  entityId: string,
): Promise<number> {
  const counts = await resolveCatalogReferenceCounts(kind, [entityId])
  return counts.get(entityId) ?? 0
}
