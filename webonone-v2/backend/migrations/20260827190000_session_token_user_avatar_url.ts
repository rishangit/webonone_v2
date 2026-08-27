import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    table.string('user_avatar_url', 2048).nullable()
  })
  await knex.schema.alterTable('company_event_session_check_ins', (table) => {
    table.string('user_avatar_url', 2048).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_check_ins', (table) => {
    table.dropColumn('user_avatar_url')
  })
  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    table.dropColumn('user_avatar_url')
  })
}
