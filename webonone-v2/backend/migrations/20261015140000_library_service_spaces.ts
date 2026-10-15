import type { Knex } from 'knex'

async function schemaTableExists(knex: Knex, schema: string, table: string): Promise<boolean> {
  const [rows] = await knex.raw(
    `SELECT 1 AS ok
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?
     LIMIT 1`,
    [schema, table],
  )
  return Array.isArray(rows) && rows.length > 0
}

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('library_service_spaces')
  if (!hasTable) {
    await knex.schema.createTable('library_service_spaces', (table) => {
      table.string('service_id', 21).notNullable()
      table.string('space_id', 21).notNullable()
      table.integer('sort_order').unsigned().notNullable()
      table.primary(['service_id', 'space_id'])
      table.index(['service_id', 'sort_order'])
    })
  }

  const hasSource = await schemaTableExists(knex, 'webonone_data', 'data_service_spaces')
  if (!hasSource) return

  await knex.raw(`
    INSERT INTO library_service_spaces (service_id, space_id, sort_order)
    SELECT service_id, space_id, sort_order
    FROM webonone_data.data_service_spaces
    ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('library_service_spaces')
}
