import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_services', (table) => {
    table.decimal('list_price', 18, 6).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_services', (table) => {
    table.dropColumn('list_price')
  })
}
