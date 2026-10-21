import type { Knex } from 'knex'

const TABLES = [
  'design_website_pages',
  'design_website_headers',
  'design_website_footers',
  'design_website_presets',
  'design_website_library_pages',
  'design_website_library_headers',
  'design_website_library_footers',
  'design_website_library_presets',
] as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    if (!(await knex.schema.hasTable(tableName))) continue
    if (await knex.schema.hasColumn(tableName, 'color_palette_id')) continue
    await knex.schema.alterTable(tableName, (table) => {
      table.string('color_palette_id', 64).nullable()
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of [...TABLES].reverse()) {
    if (!(await knex.schema.hasTable(tableName))) continue
    if (!(await knex.schema.hasColumn(tableName, 'color_palette_id'))) continue
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('color_palette_id')
    })
  }
}
