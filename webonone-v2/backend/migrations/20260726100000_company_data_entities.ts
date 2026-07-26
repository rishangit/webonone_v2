import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.json('data_entities').nullable()
  })
  await knex('companies').whereNull('data_entities').update({
    data_entities: knex.raw("CAST('[]' AS JSON)"),
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('data_entities')
  })
}
