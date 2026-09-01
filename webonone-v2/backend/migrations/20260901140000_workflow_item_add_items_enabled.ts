import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_service_workflow_items', (table) => {
    table.boolean('add_items_enabled').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_service_workflow_items', (table) => {
    table.dropColumn('add_items_enabled')
  })
}
