import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_presets', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.json('document').notNullable()
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id'], 'idx_design_website_preset_company')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_presets')
}
