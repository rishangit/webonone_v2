import type { Knex } from 'knex'

const TABLES = [
  'design_website_library_pages',
  'design_website_library_headers',
  'design_website_library_footers',
  'design_website_library_layouts',
  'design_website_library_presets',
  'design_website_library_themes',
  'design_website_library_font',
  'design_website_library_color',
  'design_website_library_text',
  'design_website_library_button',
]

/** Existing library rows stay published. New rows are inserted as draft by the service. */
export async function up(knex: Knex): Promise<void> {
  for (const name of TABLES) {
    const has = await knex.schema.hasColumn(name, 'publish_status')
    if (has) continue
    await knex.schema.alterTable(name, (table) => {
      table.enum('publish_status', ['draft', 'published']).notNullable().defaultTo('published')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const name of [...TABLES].reverse()) {
    const has = await knex.schema.hasColumn(name, 'publish_status')
    if (!has) continue
    await knex.schema.alterTable(name, (table) => {
      table.dropColumn('publish_status')
    })
  }
}
