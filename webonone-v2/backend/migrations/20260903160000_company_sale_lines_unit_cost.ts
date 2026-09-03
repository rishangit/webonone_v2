import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_sale_lines', (table) => {
    table.decimal('unit_cost', 18, 2).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_sale_lines', (table) => {
    table.dropColumn('unit_cost')
  })
}
