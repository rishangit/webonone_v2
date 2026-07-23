import { db } from '../models/db.js'

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
