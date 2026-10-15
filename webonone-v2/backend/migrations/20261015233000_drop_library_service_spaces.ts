import type { Knex } from 'knex'

/** Data library services do not store linked spaces. */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('library_service_spaces')
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('library_service_spaces')
  if (hasTable) return

  await knex.schema.createTable('library_service_spaces', (table) => {
    table.string('service_id', 21).notNullable()
    table.string('space_id', 21).notNullable()
    table.integer('sort_order').unsigned().notNullable()
    table.primary(['service_id', 'space_id'])
    table.index(['service_id', 'sort_order'])
  })
}
