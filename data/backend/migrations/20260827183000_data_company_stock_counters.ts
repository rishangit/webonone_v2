import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_company_stock_counters', (table) => {
    table.string('company_id', 21).primary()
    table.integer('next_seq').unsigned().notNullable().defaultTo(1)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_company_stock_counters')
}
