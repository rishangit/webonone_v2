import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.string('impersonated_by_user_id', 21).nullable().references('id').inTable('users')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.dropColumn('impersonated_by_user_id')
  })
}
