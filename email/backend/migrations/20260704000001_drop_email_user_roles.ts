import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_user_roles')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_user_roles', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('email_users').onDelete('CASCADE')
    table.string('role', 32).notNullable().defaultTo('member')
    table.string('company_id', 21).nullable().references('id').inTable('email_companies').onDelete('SET NULL')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['user_id'])
    table.index(['role'])
    table.index(['company_id'])
  })
}
