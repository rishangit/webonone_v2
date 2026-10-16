import type { Knex } from 'knex'

/** Product selling prices live on company product stock (per variant), not on company_products. */
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('company_products', 'list_price')
  if (hasColumn) {
    await knex.schema.alterTable('company_products', (table) => {
      table.dropColumn('list_price')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('company_products', 'list_price')
  if (!hasColumn) {
    await knex.schema.alterTable('company_products', (table) => {
      table.decimal('list_price', 18, 2).nullable()
    })
  }
}
