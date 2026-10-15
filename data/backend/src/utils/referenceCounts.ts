import { fetchCompanyCatalogReferenceCounts } from '../clients/webononeReferenceCountsClient.js'
import { db } from '../models/db.js'
import type { LibraryCatalogReferenceKind } from '../types/catalogReferenceKind.js'

export async function countTagReferences(tagId: string): Promise<number> {
  const rows = await db('data_catalog_entity_tags')
    .where({ tag_id: tagId })
    .count<{ count: number }[]>('* as count')
  return Number(rows[0]?.count ?? 0)
}

export async function countUnitReferences(unitId: string): Promise<number> {
  const [attrRows, baseRows] = await Promise.all([
    db('data_attributes').where({ unit_id: unitId }).count<{ count: number }[]>('* as count'),
    db('data_units').where({ base_unit_id: unitId }).count<{ count: number }[]>('* as count'),
  ])
  return Number(attrRows[0]?.count ?? 0) + Number(baseRows[0]?.count ?? 0)
}

export async function countAttributeReferences(attributeId: string): Promise<number> {
  const rows = await db('data_catalog_entity_attributes')
    .where({ attribute_id: attributeId })
    .count<{ count: number }[]>('* as count')
  return Number(rows[0]?.count ?? 0)
}

/** Distinct companies (WebOnOne catalog) that use each library product, service, or space. */
export async function resolveCatalogReferenceCounts(
  kind: LibraryCatalogReferenceKind,
  entityIds: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(entityIds.filter((id) => id.length > 0))]
  const totals = new Map<string, number>()
  for (const id of uniqueIds) totals.set(id, 0)
  if (uniqueIds.length === 0) return totals

  const companyCounts = await fetchCompanyCatalogReferenceCounts(kind, uniqueIds)
  for (const id of uniqueIds) {
    totals.set(id, companyCounts.get(id) ?? 0)
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
