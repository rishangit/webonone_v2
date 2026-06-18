import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('auth_codes', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('code_hash', 255).notNullable().unique()
    table.string('redirect_uri', 512).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
    table.index(['expires_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('auth_codes')
}
