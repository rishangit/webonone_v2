import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('data_stocks')
  if (!hasTable) return

  const hasColumn = await knex.schema.hasColumn('data_stocks', 'is_active')
  if (hasColumn) return

  await knex.schema.alterTable('data_stocks', (table) => {
    table.boolean('is_active').notNullable().defaultTo(false)
    table.index(['variant_id', 'is_active'])
  })

  // Promote the newest batch per variant when none is active yet.
  const variants = await knex('data_stocks').distinct('variant_id')
  for (const row of variants) {
    const variantId = (row as { variant_id: string }).variant_id
    const active = await knex('data_stocks')
      .where({ variant_id: variantId, is_active: true })
      .first()
    if (active) continue

    const newest = await knex('data_stocks')
      .where({ variant_id: variantId })
      .orderBy([
        { column: 'purchase_date', order: 'desc' },
        { column: 'created_at', order: 'desc' },
      ])
      .first()
    if (newest) {
      await knex('data_stocks').where({ id: (newest as { id: string }).id }).update({ is_active: true })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('data_stocks')
  if (!hasTable) return

  const hasColumn = await knex.schema.hasColumn('data_stocks', 'is_active')
  if (!hasColumn) return

  await knex.schema.alterTable('data_stocks', (table) => {
    table.dropIndex(['variant_id', 'is_active'])
    table.dropColumn('is_active')
  })
}
