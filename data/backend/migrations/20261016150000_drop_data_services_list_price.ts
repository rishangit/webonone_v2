import type { Knex } from 'knex'

/** Company selling prices for services are set per company in WebOnOne, not on the library service row. */
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('data_services', 'list_price')
  if (hasColumn) {
    await knex.schema.alterTable('data_services', (table) => {
      table.dropColumn('list_price')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('data_services', 'list_price')
  if (!hasColumn) {
    await knex.schema.alterTable('data_services', (table) => {
      table.decimal('list_price', 18, 6).nullable()
    })
  }
}
