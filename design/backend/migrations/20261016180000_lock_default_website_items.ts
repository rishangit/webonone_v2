import type { Knex } from 'knex'

const TABLES = [
  'design_website_pages',
  'design_website_headers',
  'design_website_footers',
  'design_website_layouts',
  'design_website_presets',
  'design_website_datasets',
  'design_website_themes',
] as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.boolean('is_locked').notNullable().defaultTo(false)
      table.index(['company_id', 'is_locked'], `idx_${tableName}_locked`)
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of [...TABLES].reverse()) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropIndex(['company_id', 'is_locked'], `idx_${tableName}_locked`)
      table.dropColumn('is_locked')
    })
  }
}
