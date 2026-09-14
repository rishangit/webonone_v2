import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // MySQL rejects DEFAULT on JSON columns (BLOB/TEXT/JSON can't have defaults).
  await knex.schema.alterTable('design_website_datasets', (table) => {
    table.json('selected_fields').nullable()
  })
  await knex('design_website_datasets').whereNull('selected_fields').update({
    selected_fields: JSON.stringify([]),
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_datasets', (table) => {
    table.dropColumn('selected_fields')
  })
}
