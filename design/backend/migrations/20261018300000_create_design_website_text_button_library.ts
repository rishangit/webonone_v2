import type { Knex } from 'knex'
import { BUTTON_LIBRARY, TEXT_LIBRARY } from '../src/catalog/websiteLibrary.js'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_text_library', (table) => {
    table.string('id', 64).primary()
    table.string('name', 128).notNullable()
    table.json('definition').notNullable()
    table.integer('sort_order').notNullable()
    table.boolean('is_active').notNullable().defaultTo(true)
    table.index(['is_active', 'sort_order'], 'idx_design_website_text_library_active')
    table.unique(['name'], 'uq_design_website_text_library_name')
  })

  await knex('design_website_text_library').insert(
    TEXT_LIBRARY.map((item) => ({
      id: item.id,
      name: item.name,
      definition: JSON.stringify(item.definition),
      sort_order: item.sortOrder,
      is_active: true,
    })),
  )

  await knex.schema.createTable('design_website_button_library', (table) => {
    table.string('id', 64).primary()
    table.string('name', 128).notNullable()
    table.json('definition').notNullable()
    table.integer('sort_order').notNullable()
    table.boolean('is_active').notNullable().defaultTo(true)
    table.index(['is_active', 'sort_order'], 'idx_design_website_button_library_active')
    table.unique(['name'], 'uq_design_website_button_library_name')
  })

  await knex('design_website_button_library').insert(
    BUTTON_LIBRARY.map((item) => ({
      id: item.id,
      name: item.name,
      definition: JSON.stringify(item.definition),
      sort_order: item.sortOrder,
      is_active: true,
    })),
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_button_library')
  await knex.schema.dropTableIfExists('design_website_text_library')
}
