import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('registration_email_otps', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable()
    table.string('otp_hash', 64).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.integer('attempt_count').notNullable().defaultTo(0)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['email'])
    table.index(['expires_at'])
  })

  await knex.schema.createTable('registration_sessions', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable()
    table.string('token_hash', 64).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['email'])
    table.index(['token_hash'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('registration_sessions')
  await knex.schema.dropTableIfExists('registration_email_otps')
}
