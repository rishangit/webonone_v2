import type { Knex } from 'knex'
import { FONT_LIBRARY, buildStarterTemplate } from '../src/catalog/websiteLibrary.js'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_font_library', (table) => {
    table.string('id', 64).primary()
    table.string('name', 128).notNullable()
    table.string('google_font_url', 2048).notNullable()
    table.string('family', 255).notNullable()
    table.integer('sort_order').notNullable()
    table.boolean('is_active').notNullable().defaultTo(true)
    table.index(['is_active', 'sort_order'], 'idx_design_website_font_library_active')
  })

  await knex('design_website_font_library').insert(
    FONT_LIBRARY.map((font) => ({
      id: font.id,
      name: font.name,
      google_font_url: font.googleFontUrl,
      family: font.family,
      sort_order: font.sortOrder,
      is_active: true,
    })),
  )

  await knex.schema.createTable('design_website_starter_templates', (table) => {
    table.string('id', 32).primary()
    table.string('slug', 64).notNullable().unique()
    table.string('name', 255).notNullable()
    table.json('theme').notNullable()
    table.json('presets').notNullable()
    table.boolean('is_active').notNullable().defaultTo(true)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  const starter = buildStarterTemplate()
  await knex('design_website_starter_templates').insert({
    id: 'default',
    slug: starter.slug,
    name: starter.name,
    theme: JSON.stringify(starter.theme),
    presets: JSON.stringify(starter.presets),
    is_active: true,
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_starter_templates')
  await knex.schema.dropTableIfExists('design_website_font_library')
}
