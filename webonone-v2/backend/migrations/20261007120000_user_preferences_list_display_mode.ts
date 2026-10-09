import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_preferences', (table) => {
    table.enum('list_display_mode', ['list', 'grid', 'card']).notNullable().defaultTo('list')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_preferences', (table) => {
    table.dropColumn('list_display_mode')
  })
}
