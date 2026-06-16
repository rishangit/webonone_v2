import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable().unique()
    table.string('password_hash', 255).notNullable()
    table.string('display_name', 255).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('token_hash', 255).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('revoked_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
  })

  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('token_hash', 255).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_tokens')
  await knex.schema.dropTableIfExists('refresh_tokens')
  await knex.schema.dropTableIfExists('users')
}
