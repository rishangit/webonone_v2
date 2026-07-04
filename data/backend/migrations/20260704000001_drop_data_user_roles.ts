import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_user_roles')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_user_roles', (table) => {
    table.string('user_id', 21).primary()
    table.string('role', 32).notNullable().defaultTo('member')
    table.string('company_id', 21).nullable()
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['role'])
    table.index(['company_id'])
  })
}
