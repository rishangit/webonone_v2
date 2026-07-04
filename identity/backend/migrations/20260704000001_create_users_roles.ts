import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users_roles', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable()
    table.enum('role', ['super_admin', 'company_admin', 'member']).notNullable()
    table.string('company_id', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    table.unique(['user_id', 'company_id', 'role'])
    table.index(['user_id'])
    table.index(['company_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users_roles')
}
