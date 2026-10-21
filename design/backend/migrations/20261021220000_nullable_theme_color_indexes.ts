import type { Knex } from 'knex'

const TABLES = ['design_website_themes', 'design_website_library_themes'] as const

const COLUMNS = [
  'page_background_index',
  'surface_index',
  'body_text_index',
  'accent_1_index',
  'accent_2_index',
] as const

/** None on a theme color dropdown stores SQL NULL. Existing rows keep their slot. */
export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    const exists = await knex.schema.hasTable(tableName)
    if (!exists) continue
    await knex.schema.alterTable(tableName, (table) => {
      for (const column of COLUMNS) {
        table.tinyint(column).unsigned().nullable().alter()
      }
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    const exists = await knex.schema.hasTable(tableName)
    if (!exists) continue
    for (const column of COLUMNS) {
      await knex(tableName).whereNull(column).update({ [column]: 1 })
    }
    await knex.schema.alterTable(tableName, (table) => {
      for (const column of COLUMNS) {
        table.tinyint(column).unsigned().notNullable().defaultTo(1).alter()
      }
    })
  }
}
