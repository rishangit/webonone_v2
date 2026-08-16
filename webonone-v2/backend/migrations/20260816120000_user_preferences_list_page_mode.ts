import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_preferences', (table) => {
    table
      .enum('list_page_mode', ['pagination', 'on-scroll'])
      .notNullable()
      .defaultTo('pagination')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_preferences', (table) => {
    table.dropColumn('list_page_mode')
  })
}
