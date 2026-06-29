import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_otps', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('otp_hash', 64).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.integer('attempt_count').notNullable().defaultTo(0)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
    table.index(['expires_at'])
  })

  await knex.schema.createTable('password_reset_sessions', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('token_hash', 64).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
    table.index(['token_hash'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_sessions')
  await knex.schema.dropTableIfExists('password_reset_otps')
}
