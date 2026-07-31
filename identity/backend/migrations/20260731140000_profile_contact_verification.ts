import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_phone_verified').notNullable().defaultTo(false)
  })

  await knex.schema.createTable('profile_email_otps', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('email', 255).notNullable()
    table.string('otp_hash', 64).notNullable()
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.integer('attempt_count').notNullable().defaultTo(0)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
    table.index(['email'])
    table.index(['expires_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('profile_email_otps')
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_phone_verified')
  })
}
