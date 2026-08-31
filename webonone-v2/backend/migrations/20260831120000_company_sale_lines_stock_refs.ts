import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_sale_lines', (table) => {
    table.string('library_variant_id', 21).nullable()
    table.string('library_stock_id', 21).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_sale_lines', (table) => {
    table.dropColumn('library_variant_id')
    table.dropColumn('library_stock_id')
  })
}
