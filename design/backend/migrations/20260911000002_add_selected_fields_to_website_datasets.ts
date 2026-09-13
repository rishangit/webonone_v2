import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_datasets', (table) => {
    table.json('selected_fields').notNullable().defaultTo('[]')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_datasets', (table) => {
    table.dropColumn('selected_fields')
  })
}
