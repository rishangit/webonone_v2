import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_pages', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.string('path', 128).notNullable().defaultTo('')
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active')
    table.json('document').notNullable()
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['company_id', 'path'], { indexName: 'uniq_design_website_page_path' })
    table.index(['company_id', 'status'], 'idx_design_website_page_status')
  })

  await knex.schema.createTable('design_website_headers', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.json('document').notNullable()
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id', 'is_default'], 'idx_design_website_header_default')
  })

  await knex.schema.createTable('design_website_footers', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.json('document').notNullable()
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id', 'is_default'], 'idx_design_website_footer_default')
  })

  await knex.schema.createTable('design_website_themes', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.string('page_background', 32).notNullable().defaultTo('#ffffff')
    table.string('body_text_color', 32).notNullable().defaultTo('#111827')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.boolean('is_default').notNullable().defaultTo(false)
    table.json('fonts').notNullable()
    table.json('colors').notNullable()
    table.json('text_styles').notNullable()
    table.json('button_styles').notNullable()
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id', 'is_default'], 'idx_design_website_theme_default')
    table.index(['company_id', 'is_active'], 'idx_design_website_theme_active')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_themes')
  await knex.schema.dropTableIfExists('design_website_footers')
  await knex.schema.dropTableIfExists('design_website_headers')
  await knex.schema.dropTableIfExists('design_website_pages')
}
