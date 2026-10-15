import type { Knex } from 'knex'

/** Library services do not link spaces. */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_service_spaces')
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('data_service_spaces')
  if (hasTable) return

  await knex.schema.createTable('data_service_spaces', (table) => {
    table
      .string('service_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_services')
      .onDelete('CASCADE')
    table
      .string('space_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_spaces')
      .onDelete('CASCADE')
    table.integer('sort_order').unsigned().notNullable()
    table.primary(['service_id', 'space_id'])
    table.index(['service_id', 'sort_order'])
  })
}
