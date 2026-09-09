import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_site_settings', (table) => {
    table.string('company_id', 21).primary()
    table.string('home_page_id', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table
      .foreign('home_page_id')
      .references('id')
      .inTable('design_website_pages')
      .onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_site_settings')
}
