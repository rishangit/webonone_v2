import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_form_templates', (table) => {
    table.string('id', 21).primary()
    // WebOnOne company id (JWT company_id) — ID copy only; no local companies table
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.string('slug', 128).notNullable()
    table.json('definition').notNullable()
    table.enum('status', ['draft', 'published']).notNullable().defaultTo('draft')
    // Identity user id (JWT sub) — ID copy only; no FK to another service
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['company_id', 'slug'], { indexName: 'uniq_design_form_company_slug' })
    table.index(['company_id', 'status'], 'idx_design_form_company_status')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_form_templates')
}
