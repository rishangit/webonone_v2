import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_datasets', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table
      .enum('source_type', ['products', 'services', 'spaces', 'staff', 'users', 'analytics'])
      .notNullable()
    table.json('filters').notNullable()
    table.json('config').nullable()
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active')
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id'], 'idx_design_website_dataset_company')
    table.index(['company_id', 'status'], 'idx_design_website_dataset_company_status')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_website_datasets')
}
