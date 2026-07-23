import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('email', 255).nullable().alter()
  })

  await knex.schema.alterTable('users', (table) => {
    table.unique(['phone_number'], { indexName: 'users_phone_number_unique' })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropUnique(['phone_number'], 'users_phone_number_unique')
  })

  await knex('users').whereNull('email').update({
    email: knex.raw("CONCAT('placeholder+', id, '@invalid.local')"),
  })

  await knex.schema.alterTable('users', (table) => {
    table.string('email', 255).notNullable().alter()
  })
}
