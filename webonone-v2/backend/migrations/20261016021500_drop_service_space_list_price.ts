import type { Knex } from 'knex'

const TABLES = ['company_services', 'company_spaces'] as const

async function hasColumn(knex: Knex, tableName: string, columnName: string): Promise<boolean> {
  return knex.schema.hasColumn(tableName, columnName)
}

/** Selling prices for services and spaces live in company_catalog_price_rules. */
export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    if (await hasColumn(knex, tableName, 'list_price')) {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropColumn('list_price')
      })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    if (!(await hasColumn(knex, tableName, 'list_price'))) {
      await knex.schema.alterTable(tableName, (table) => {
        table.decimal('list_price', 18, 2).nullable()
      })
    }
  }
}
