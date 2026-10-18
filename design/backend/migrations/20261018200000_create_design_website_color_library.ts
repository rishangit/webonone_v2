import type { Knex } from 'knex'
import { COLOR_LIBRARY_PALETTES } from '../src/catalog/websiteLibrary.js'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_color_library', (table) => {
    table.string('id', 64).primary()
    table.string('name', 128).notNullable()
    table.json('palette').notNullable()
    table.integer('sort_order').notNullable()
    table.boolean('is_active').notNullable().defaultTo(true)
    table.index(['is_active', 'sort_order'], 'idx_design_website_color_library_active')
    table.unique(['name'], 'uq_design_website_color_library_name')
  })

  await knex('design_website_color_library').insert(
    COLOR_LIBRARY_PALETTES.map((item) => ({
      id: item.id,
      name: item.name,
      palette: JSON.stringify(item.palette),
      sort_order: item.sortOrder,
      is_active: true,
    })),
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_color_library')
}
