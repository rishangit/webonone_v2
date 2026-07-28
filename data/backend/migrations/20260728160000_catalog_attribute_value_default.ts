import type { Knex } from 'knex'

const VALUE_TABLES = [
  'data_product_attribute_values',
  'data_service_attribute_values',
  'data_space_attribute_values',
] as const

const ENTITY_ID_COLS = {
  data_product_attribute_values: 'product_id',
  data_service_attribute_values: 'service_id',
  data_space_attribute_values: 'space_id',
} as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of VALUE_TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.boolean('is_default').notNullable().defaultTo(false)
    })

    const idCol = ENTITY_ID_COLS[tableName]
    const rows = await knex(tableName)
      .select('id', idCol, 'attribute_id')
      .orderBy([
        { column: idCol, order: 'asc' },
        { column: 'attribute_id', order: 'asc' },
        { column: 'created_at', order: 'asc' },
      ])

    const seen = new Set<string>()
    for (const row of rows) {
      const key = `${row[idCol] as string}:${row.attribute_id as string}`
      if (seen.has(key)) continue
      seen.add(key)
      await knex(tableName).where({ id: row.id }).update({ is_default: true })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of [...VALUE_TABLES].reverse()) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('is_default')
    })
  }
}
