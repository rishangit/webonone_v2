import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('_schema_version', (table) => {
    table.string('id', 21).primary()
    table.string('version', 50).notNullable()
    table.datetime('applied_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })
  await knex('_schema_version').insert({ id: 'stub00000000000000001', version: '1.0.0-stub' })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('_schema_version')
}
