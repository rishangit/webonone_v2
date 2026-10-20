import type { Knex } from 'knex'
import { migrateThemeColorRecord } from '../src/utils/themeColorStorage.js'

const TABLES = ['design_website_themes', 'design_website_library_themes'] as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.string('color_palette_id', 64).nullable()
      table.tinyint('page_background_index').unsigned().notNullable().defaultTo(1)
      table.tinyint('surface_index').unsigned().notNullable().defaultTo(1)
      table.tinyint('body_text_index').unsigned().notNullable().defaultTo(1)
      table.tinyint('accent_1_index').unsigned().notNullable().defaultTo(1)
      table.tinyint('accent_2_index').unsigned().notNullable().defaultTo(1)
    })

    const rows = await knex(tableName).select(
      'id',
      'page_background',
      'body_text_color',
      'colors',
      'color_palettes',
      'color_roles',
      'text_styles',
      'button_styles',
    )
    for (const row of rows) {
      const migrated = migrateThemeColorRecord(row)
      await knex(tableName)
        .where({ id: row.id })
        .update({
          color_palette_id: migrated.color_palette_id,
          page_background_index: migrated.page_background_index,
          surface_index: migrated.surface_index,
          body_text_index: migrated.body_text_index,
          accent_1_index: migrated.accent_1_index,
          accent_2_index: migrated.accent_2_index,
          color_palettes: JSON.stringify(migrated.color_palettes),
          text_styles: JSON.stringify(migrated.text_styles),
          button_styles: JSON.stringify(migrated.button_styles),
        })
    }

    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('page_background')
      table.dropColumn('body_text_color')
      table.dropColumn('colors')
      table.dropColumn('color_roles')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.string('page_background', 32).notNullable().defaultTo('#ffffff')
      table.string('body_text_color', 32).notNullable().defaultTo('#111827')
      table.json('colors').notNullable()
      table.json('color_roles').nullable()
    })
    await knex(tableName).update({
      colors: JSON.stringify([]),
      color_roles: JSON.stringify({}),
    })
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('color_palette_id')
      table.dropColumn('page_background_index')
      table.dropColumn('surface_index')
      table.dropColumn('body_text_index')
      table.dropColumn('accent_1_index')
      table.dropColumn('accent_2_index')
    })
  }
}
