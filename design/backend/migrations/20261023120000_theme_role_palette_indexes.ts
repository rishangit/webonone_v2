import type { Knex } from 'knex'

const TABLES = ['design_website_themes', 'design_website_library_themes'] as const

const COLUMNS = [
  'page_background_palette_index',
  'surface_palette_index',
  'body_text_palette_index',
  'accent_1_palette_index',
  'accent_2_palette_index',
] as const

/** Null uses the theme color palette. A number is the 1-based palette on that theme. */
export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    const exists = await knex.schema.hasTable(tableName)
    if (!exists) continue
    await knex.schema.alterTable(tableName, (table) => {
      for (const column of COLUMNS) {
        table.tinyint(column).unsigned().nullable()
      }
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    const exists = await knex.schema.hasTable(tableName)
    if (!exists) continue
    await knex.schema.alterTable(tableName, (table) => {
      for (const column of COLUMNS) {
        table.dropColumn(column)
      }
    })
  }
}
