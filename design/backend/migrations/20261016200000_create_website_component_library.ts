import type { Knex } from 'knex'

const COMPANY_SOURCE: Array<{ table: string; library: string }> = [
  { table: 'design_website_pages', library: 'design_website_library_pages' },
  { table: 'design_website_headers', library: 'design_website_library_headers' },
  { table: 'design_website_footers', library: 'design_website_library_footers' },
  { table: 'design_website_layouts', library: 'design_website_library_layouts' },
  { table: 'design_website_presets', library: 'design_website_library_presets' },
  { table: 'design_website_themes', library: 'design_website_library_themes' },
]

function timestamps(knex: Knex, table: Knex.CreateTableBuilder) {
  table.string('created_by', 21).nullable()
  table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_library_headers', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.json('document').notNullable()
    timestamps(knex, table)
  })

  await knex.schema.createTable('design_website_library_footers', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.json('document').notNullable()
    timestamps(knex, table)
  })

  await knex.schema.createTable('design_website_library_themes', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.string('page_background', 32).notNullable().defaultTo('#ffffff')
    table.string('body_text_color', 32).notNullable().defaultTo('#111827')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.boolean('is_default').notNullable().defaultTo(false)
    table.json('fonts').notNullable()
    table.json('colors').notNullable()
    table.json('text_styles').notNullable()
    table.json('button_styles').notNullable()
    timestamps(knex, table)
  })

  await knex.schema.createTable('design_website_library_presets', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.json('document').notNullable()
    timestamps(knex, table)
  })

  await knex.schema.createTable('design_website_library_layouts', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.string('header_id', 21).nullable()
    table.string('footer_id', 21).nullable()
    table.string('theme_id', 21).nullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    timestamps(knex, table)
    table.foreign('header_id').references('id').inTable('design_website_library_headers').onDelete('SET NULL')
    table.foreign('footer_id').references('id').inTable('design_website_library_footers').onDelete('SET NULL')
    table.foreign('theme_id').references('id').inTable('design_website_library_themes').onDelete('SET NULL')
  })

  await knex.schema.createTable('design_website_library_pages', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.string('path', 128).notNullable().defaultTo('')
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active')
    table.string('layout_id', 21).nullable()
    table.integer('sort_order').notNullable().defaultTo(0)
    table.json('document').notNullable()
    timestamps(knex, table)
    table.unique(['path'], { indexName: 'uniq_design_website_library_page_path' })
    table.foreign('layout_id').references('id').inTable('design_website_library_layouts').onDelete('SET NULL')
  })

  for (const { table, library } of COMPANY_SOURCE) {
    await knex.schema.alterTable(table, (builder) => {
      builder.string('source_library_id', 21).nullable()
      builder.foreign('source_library_id').references('id').inTable(library).onDelete('SET NULL')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const { table } of [...COMPANY_SOURCE].reverse()) {
    await knex.schema.alterTable(table, (builder) => {
      builder.dropForeign(['source_library_id'])
      builder.dropColumn('source_library_id')
    })
  }
  await knex.schema.dropTableIfExists('design_website_library_pages')
  await knex.schema.dropTableIfExists('design_website_library_layouts')
  await knex.schema.dropTableIfExists('design_website_library_presets')
  await knex.schema.dropTableIfExists('design_website_library_themes')
  await knex.schema.dropTableIfExists('design_website_library_footers')
  await knex.schema.dropTableIfExists('design_website_library_headers')
}
