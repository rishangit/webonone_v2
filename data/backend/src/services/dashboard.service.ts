import { db } from '../models/db.js'

const ENTITIES = [
  'data_tags',
  'data_units',
  'data_attributes',
  'data_products',
  'data_services',
  'data_spaces',
] as const

export async function getDashboardStats() {
  const counts: Record<string, { verified: number; pending: number }> = {}

  for (const table of ENTITIES) {
    const verified = await db(table).where({ status: 'verified' }).count<{ count: number }[]>('* as count')
    const pending = await db(table).where({ status: 'pending' }).count<{ count: number }[]>('* as count')
    const key = table.replace('data_', '')
    counts[key] = {
      verified: Number(verified[0]?.count ?? 0),
      pending: Number(pending[0]?.count ?? 0),
    }
  }

  return { counts }
}
